/**
 * YouTubePlugin — Invidious API tabanlı
 *
 * Neden Invidious?
 * - Sunucu/VPS IP'leri YouTube tarafından engelleniyor
 * - Invidious kendi sunucularından YouTube'a bağlanıyor (IP sorunu yok)
 * - Ücretsiz, API key gerektirmiyor, limitsiz
 * - Birden fazla instance → biri çökerse diğeri devreye girer
 *
 * Akış:
 *   Arama/Meta bilgisi → Invidious API (hızlı, güvenilir)
 *   Stream URL        → Invidious API (önce), yt-dlp fallback
 */

const { PlayableExtractorPlugin, Song, Playlist, DisTubeError } = require('distube');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const YTDLP_BIN = path.join(__dirname, '../../node_modules/@distube/yt-dlp/bin/yt-dlp');
const COOKIES_PATH = process.env.YOUTUBE_COOKIES_PATH || '/app/cookies.txt';

// Güvenilir Invidious instance'ları (sırayla denenir)
const INVIDIOUS_INSTANCES = [
  'https://inv.nadeko.net',
  'https://invidious.io.lol',
  'https://yewtu.be',
  'https://invidious.privacyredirect.com',
  'https://iv.datura.network',
];

// ─── Yardımcı: Invidious API isteği (instance fallover ile) ───────────────────

async function invFetch(apiPath, timeoutMs = 12000) {
  let lastError;
  for (const base of INVIDIOUS_INSTANCES) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      const res = await fetch(`${base}${apiPath}`, { signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) {
        lastError = new Error(`${base} HTTP ${res.status}`);
        continue;
      }
      return await res.json();
    } catch (err) {
      lastError = err;
      // sonraki instance'ı dene
    }
  }
  throw new Error(`Tüm Invidious sunucuları başarısız: ${lastError?.message}`);
}

async function invSearch(query) {
  const qs = `q=${encodeURIComponent(query)}&type=video&fields=videoId,title,author,authorUrl,lengthSeconds,viewCount,videoThumbnails`;
  const results = await invFetch(`/api/v1/search?${qs}`);
  if (!Array.isArray(results) || !results.length) throw new Error(`"${query}" için sonuç bulunamadı`);
  return results[0];
}

async function invVideoInfo(videoId) {
  return invFetch(`/api/v1/videos/${videoId}?fields=videoId,title,author,authorUrl,lengthSeconds,viewCount,videoThumbnails,adaptiveFormats,formatStreams,isLive`);
}

async function invPlaylistInfo(playlistId) {
  return invFetch(`/api/v1/playlists/${playlistId}?fields=playlistId,title,author,authorUrl,thumbnail,videos`);
}

function pickStreamUrl(info) {
  // Önce adaptiveFormats içinden audio-only en yüksek bitrate
  const audioFormats = (info.adaptiveFormats || [])
    .filter(f => f.type?.startsWith('audio/') && f.url)
    .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
  if (audioFormats[0]?.url) return audioFormats[0].url;

  // Fallback: formatStreams (video+audio birleşik, en azından ses içerir)
  const stream = (info.formatStreams || []).find(f => f.url);
  if (stream?.url) return stream.url;

  return null;
}

// ─── yt-dlp fallback (proxy/cookie varsa kullan) ─────────────────────────────

function ytdlpGetStreamUrl(songUrl, timeoutMs = 45000) {
  return new Promise((resolve, reject) => {
    const args = [
      '--no-warnings',
      '--get-url',
      '-f', 'bestaudio/best',
      '--socket-timeout', '15',
      '--retries', '1',
      '--extractor-args', 'youtube:player_client=tv,android,ios',
    ];
    if (fs.existsSync(COOKIES_PATH)) args.push('--cookies', COOKIES_PATH);
    if (process.env.YTDLP_PROXY) args.push('--proxy', process.env.YTDLP_PROXY);
    args.push(songUrl);

    const proc = execFile(YTDLP_BIN, args, { maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
      clearTimeout(timer);
      if (err) return reject(new Error(stderr?.trim() || err.message));
      const url = stdout.trim().split('\n')[0];
      if (!url) return reject(new Error('yt-dlp stream URL döndürmedi'));
      resolve(url);
    });
    const timer = setTimeout(() => {
      proc.kill();
      reject(new Error('yt-dlp zaman aşımına uğradı'));
    }, timeoutMs);
  });
}

// ─── YouTube Data API v3 (opsiyonel, YOUTUBE_API_KEY varsa search için) ──────

async function youtubeApiSearch(query) {
  const key = process.env.YOUTUBE_API_KEY;
  const qs = `part=snippet&type=video&maxResults=1&q=${encodeURIComponent(query)}&key=${key}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${qs}`, { signal: ctrl.signal });
  clearTimeout(timer);
  const json = await res.json();
  if (json.error) throw new Error(`YouTube API: ${json.error.message}`);
  const item = json.items?.[0];
  if (!item) throw new Error('Sonuç bulunamadı');
  return {
    videoId: item.id.videoId,
    title: item.snippet.title,
    author: item.snippet.channelTitle,
    lengthSeconds: 0,
    viewCount: 0,
    videoThumbnails: [{ url: item.snippet.thumbnails?.medium?.url }],
  };
}

// ─── Yardımcı ─────────────────────────────────────────────────────────────────

function extractVideoId(url) {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1);
    return u.searchParams.get('v');
  } catch {
    return null;
  }
}

function isUrl(str) {
  return /^https?:\/\//i.test(str);
}

function isYouTubeUrl(str) {
  return /youtube\.com|youtu\.be/i.test(str);
}

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
        return await this._playlist(listMatch[1], url, options);
      }

      return await this._video(url, options);
    } catch (err) {
      throw new DisTubeError('YTDLP_ERROR', err.message);
    }
  }

  async _search(query, options) {
    let result;

    // 1. YouTube Data API (varsa, kota izin verdiği sürece)
    if (process.env.YOUTUBE_API_KEY) {
      try {
        result = await youtubeApiSearch(query);
      } catch (e) {
        console.warn('[YouTubePlugin] Data API başarısız, Invidious deneniyor:', e.message);
      }
    }

    // 2. Invidious API
    if (!result) {
      result = await invSearch(query);
    }

    return this._makeSong(result, options);
  }

  async _video(url, options) {
    const videoId = extractVideoId(url);
    if (!videoId) throw new Error('Geçersiz YouTube URL: ' + url);
    const info = await invVideoInfo(videoId);
    return this._makeSong(info, options);
  }

  async _playlist(playlistId, originalUrl, options) {
    const info = await invPlaylistInfo(playlistId);
    const songs = (info.videos || []).map(v => this._makeSong(v, options));
    return new Playlist({
      source: 'youtube',
      songs,
      id: info.playlistId,
      name: info.title,
      url: `https://www.youtube.com/playlist?list=${info.playlistId}`,
      thumbnail: info.thumbnail || info.videos?.[0]?.videoThumbnails?.at(-1)?.url,
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

  async getStreamURL(song) {
    const videoId = song.id || extractVideoId(song.url);
    if (!videoId) throw new DisTubeError('YTDLP_ERROR', 'Video ID bulunamadı');

    // 1. Invidious'tan stream URL al
    try {
      const info = await invVideoInfo(videoId);
      const streamUrl = pickStreamUrl(info);
      if (streamUrl) return streamUrl;
    } catch (err) {
      console.warn('[YouTubePlugin] Invidious stream URL başarısız:', err.message);
    }

    // 2. Fallback: yt-dlp (proxy/cookie varsa işe yarayabilir)
    return ytdlpGetStreamUrl(song.url);
  }

  getRelatedSongs() {
    return [];
  }
}

module.exports = { YouTubePlugin };
