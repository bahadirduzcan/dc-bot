/**
 * YouTubePlugin — Invidious API + yt-dlp fallback
 * fetch yerine https modülü kullanır (Docker slim imajlarında daha güvenilir)
 */

const { PlayableExtractorPlugin, Song, Playlist, DisTubeError } = require('distube');
const { execFile } = require('child_process');
const https = require('https');
const path = require('path');
const fs = require('fs');
const { HttpsProxyAgent } = require('https-proxy-agent');

const YTDLP_BIN = path.join(__dirname, '../../node_modules/@distube/yt-dlp/bin/yt-dlp');
const COOKIES_PATH = process.env.YOUTUBE_COOKIES_PATH || '/app/cookies.txt';

// Güvenilir Invidious instance'ları (sırayla denenir)
// Test edilmiş çalışanlar: inv.riverside.rocks, iv.melmac.space
const INVIDIOUS_INSTANCES = (process.env.INVIDIOUS_INSTANCES
  ? process.env.INVIDIOUS_INSTANCES.split(',').map(s => s.trim())
  : ['inv.riverside.rocks', 'iv.melmac.space']);

// ─── https modülü ile GET isteği (redirect + proxy destekli) ─────────────────

function httpsGet(host, apiPath, timeoutMs = 12000, redirects = 3) {
  const proxy = process.env.YTDLP_PROXY || process.env.HTTPS_PROXY;
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: host,
      path: apiPath,
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: timeoutMs,
      ...(proxy ? { agent: new HttpsProxyAgent(proxy) } : {}),
    }, (res) => {
      // 301/302 redirect takibi
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location && redirects > 0) {
        res.resume();
        try {
          const loc = new URL(res.headers.location, `https://${host}`);
          httpsGet(loc.hostname, loc.pathname + loc.search, timeoutMs, redirects - 1)
            .then(resolve).catch(reject);
        } catch { reject(new Error(`Geçersiz redirect: ${res.headers.location}`)); }
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('JSON parse hatası')); }
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.on('error', reject);
    req.end();
  });
}

async function invFetch(apiPath, timeoutMs = 12000) {
  let lastErr;
  for (const host of INVIDIOUS_INSTANCES) {
    try {
      return await httpsGet(host, apiPath, timeoutMs);
    } catch (err) {
      lastErr = err;
    }
  }
  throw new Error(`Tüm Invidious sunucuları başarısız: ${lastErr?.message}`);
}

async function invSearch(query) {
  const qs = encodeURIComponent(query);
  const results = await invFetch(`/api/v1/search?q=${qs}&type=video&fields=videoId,title,author,authorUrl,lengthSeconds,viewCount,videoThumbnails`);
  if (!Array.isArray(results) || !results.length) throw new Error(`"${query}" için sonuç bulunamadı`);
  return results[0];
}

async function invVideoInfo(videoId) {
  return invFetch(`/api/v1/videos/${videoId}?fields=videoId,title,author,authorUrl,lengthSeconds,viewCount,videoThumbnails,adaptiveFormats,formatStreams,isLive`);
}

async function invPlaylistInfo(playlistId) {
  return invFetch(`/api/v1/playlists/${playlistId}?fields=playlistId,title,author,thumbnail,videos`);
}

function pickStreamUrl(info) {
  const audioFormats = (info.adaptiveFormats || [])
    .filter(f => f.type?.startsWith('audio/') && f.url)
    .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
  if (audioFormats[0]?.url) return audioFormats[0].url;

  const stream = (info.formatStreams || []).find(f => f.url);
  if (stream?.url) return stream.url;

  return null;
}

// ─── YouTube Data API v3 (opsiyonel) ─────────────────────────────────────────

function youtubeApiSearch(query) {
  return new Promise((resolve, reject) => {
    const key = process.env.YOUTUBE_API_KEY;
    const qs = `part=snippet&type=video&maxResults=1&q=${encodeURIComponent(query)}&key=${key}`;
    const req = https.request({
      hostname: 'www.googleapis.com',
      path: `/youtube/v3/search?${qs}`,
      method: 'GET',
      timeout: 10000,
    }, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) return reject(new Error(json.error.message));
          const item = json.items?.[0];
          if (!item) return reject(new Error('Sonuç bulunamadı'));
          resolve({
            videoId: item.id.videoId,
            title: item.snippet.title,
            author: item.snippet.channelTitle,
            lengthSeconds: 0,
            viewCount: 0,
            videoThumbnails: [{ url: item.snippet.thumbnails?.medium?.url }],
          });
        } catch { reject(new Error('API yanıtı parse edilemedi')); }
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.on('error', reject);
    req.end();
  });
}

// ─── yt-dlp (metadata + stream fallback) ─────────────────────────────────────

function buildYtdlpArgs(extra = []) {
  const args = [
    '--no-warnings',
    '--socket-timeout', '15',
    '--retries', '1',
    '--extractor-args', 'youtube:player_client=tv,android,ios',
    ...extra,
  ];
  if (fs.existsSync(COOKIES_PATH)) args.push('--cookies', COOKIES_PATH);
  if (process.env.YTDLP_PROXY) args.push('--proxy', process.env.YTDLP_PROXY);
  return args;
}

function runYtdlp(args, timeoutMs = 40000) {
  return new Promise((resolve, reject) => {
    const proc = execFile(YTDLP_BIN, args, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      clearTimeout(timer);
      if (err) return reject(new Error(stderr?.trim() || err.message));
      try { resolve(JSON.parse(stdout)); }
      catch { reject(new Error('yt-dlp çıktısı parse edilemedi')); }
    });
    const timer = setTimeout(() => { proc.kill(); reject(new Error('yt-dlp zaman aşımına uğradı')); }, timeoutMs);
  });
}

function ytdlpGetStreamUrl(songUrl, timeoutMs = 40000) {
  return new Promise((resolve, reject) => {
    const args = buildYtdlpArgs(['--get-url', '-f', 'bestaudio/best', songUrl]);
    const proc = execFile(YTDLP_BIN, args, { maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
      clearTimeout(timer);
      if (err) return reject(new Error(stderr?.trim() || err.message));
      const url = stdout.trim().split('\n')[0];
      if (!url) return reject(new Error('yt-dlp stream URL döndürmedi'));
      resolve(url);
    });
    const timer = setTimeout(() => { proc.kill(); reject(new Error('yt-dlp zaman aşımına uğradı')); }, timeoutMs);
  });
}

// ─── Yardımcılar ──────────────────────────────────────────────────────────────

function extractVideoId(url) {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0];
    return u.searchParams.get('v');
  } catch { return null; }
}

function isUrl(str) { return /^https?:\/\//i.test(str); }
function isYouTubeUrl(str) { return /youtube\.com|youtu\.be/i.test(str); }

// ─── Plugin ───────────────────────────────────────────────────────────────────

class YouTubePlugin extends PlayableExtractorPlugin {
  validate(url) {
    return isYouTubeUrl(url) || !isUrl(url);
  }

  async resolve(url, options) {
    try {
      if (!isUrl(url)) return await this._search(url, options);

      const listMatch = url.match(/[?&]list=([^&]+)/);
      if (listMatch && !listMatch[1].startsWith('RD')) {
        return await this._playlist(listMatch[1], options);
      }

      return await this._video(url, options);
    } catch (err) {
      throw new DisTubeError('YTDLP_ERROR', err.message);
    }
  }

  async _search(query, options) {
    // 1. YouTube Data API (varsa)
    if (process.env.YOUTUBE_API_KEY) {
      try {
        return this._makeSong(await youtubeApiSearch(query), options);
      } catch (e) {
        console.warn('[YouTubePlugin] Data API başarısız:', e.message);
      }
    }

    // 2. Invidious
    try {
      return this._makeSong(await invSearch(query), options);
    } catch (e) {
      console.warn('[YouTubePlugin] Invidious arama başarısız:', e.message);
    }

    // 3. yt-dlp fallback
    const data = await runYtdlp(buildYtdlpArgs([
      '--dump-json', '--skip-download', '--flat-playlist', `ytsearch1:${query}`,
    ]));
    const entry = data.entries?.[0] || data;
    if (!entry?.id) throw new Error(`"${query}" için sonuç bulunamadı`);
    return this._makeSongFromYtdlp(entry, options);
  }

  async _video(url, options) {
    const videoId = extractVideoId(url);
    if (!videoId) throw new Error('Geçersiz YouTube URL: ' + url);

    // 1. Invidious
    try {
      return this._makeSong(await invVideoInfo(videoId), options);
    } catch (e) {
      console.warn('[YouTubePlugin] Invidious video info başarısız:', e.message);
    }

    // 2. yt-dlp fallback
    const data = await runYtdlp(buildYtdlpArgs(['--dump-json', '--skip-download', url]));
    return this._makeSongFromYtdlp(data, options);
  }

  async _playlist(playlistId, options) {
    // 1. Invidious
    try {
      const info = await invPlaylistInfo(playlistId);
      const songs = (info.videos || []).map(v => this._makeSong(v, options));
      return new Playlist({
        source: 'youtube',
        songs,
        id: info.playlistId,
        name: info.title,
        url: `https://www.youtube.com/playlist?list=${info.playlistId}`,
        thumbnail: info.thumbnail || songs[0]?.thumbnail,
      }, options);
    } catch (e) {
      console.warn('[YouTubePlugin] Invidious playlist başarısız:', e.message);
    }

    // 2. yt-dlp fallback
    const data = await runYtdlp(buildYtdlpArgs([
      '--dump-json', '--skip-download', '--flat-playlist',
      `https://www.youtube.com/playlist?list=${playlistId}`,
    ]), 90000);
    const songs = (data.entries || []).map(e => this._makeSongFromYtdlp(e, options));
    return new Playlist({
      source: 'youtube',
      songs,
      id: data.id,
      name: data.title,
      url: data.webpage_url || `https://www.youtube.com/playlist?list=${playlistId}`,
      thumbnail: data.thumbnail,
    }, options);
  }

  _makeSong(data, options) {
    const id = data.videoId;
    return new Song({
      plugin: this,
      source: 'youtube',
      playFromSource: true,
      id,
      name: data.title || 'Bilinmeyen',
      url: `https://www.youtube.com/watch?v=${id}`,
      isLive: data.isLive || false,
      thumbnail: data.videoThumbnails?.at(-1)?.url ?? data.videoThumbnails?.[0]?.url,
      duration: data.lengthSeconds || 0,
      uploader: {
        name: data.author,
        url: data.authorUrl ? `https://www.youtube.com${data.authorUrl}` : undefined,
      },
      views: data.viewCount || 0,
    }, options);
  }

  _makeSongFromYtdlp(data, options) {
    const id = data.id;
    return new Song({
      plugin: this,
      source: 'youtube',
      playFromSource: true,
      id,
      name: data.title || 'Bilinmeyen',
      url: data.webpage_url || `https://www.youtube.com/watch?v=${id}`,
      isLive: data.is_live || false,
      thumbnail: data.thumbnail,
      duration: data.duration || 0,
      uploader: {
        name: data.uploader || data.channel,
        url: data.uploader_url || data.channel_url,
      },
      views: data.view_count || 0,
    }, options);
  }

  async getStreamURL(song) {
    const videoId = song.id || extractVideoId(song.url);

    // 1. Invidious'tan stream URL
    if (videoId) {
      try {
        const info = await invVideoInfo(videoId);
        const url = pickStreamUrl(info);
        if (url) return url;
      } catch (e) {
        console.warn('[YouTubePlugin] Invidious stream URL başarısız:', e.message);
      }
    }

    // 2. yt-dlp fallback
    return ytdlpGetStreamUrl(song.url);
  }

  getRelatedSongs() { return []; }
}

module.exports = { YouTubePlugin };
