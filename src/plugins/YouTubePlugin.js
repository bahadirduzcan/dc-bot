const { PlayableExtractorPlugin, Song, Playlist, DisTubeError } = require('distube');
const { execFile } = require('child_process');
const https = require('https');
const path = require('path');
const fs = require('fs');

const YTDLP_BIN = path.join(__dirname, '../../node_modules/@distube/yt-dlp/bin/yt-dlp');
const COOKIES_PATH = process.env.YOUTUBE_COOKIES_PATH || '/app/cookies.txt';

// ─── YouTube Data API v3 (arama için) ────────────────────────────────────────

function youtubeApiSearch(query) {
  return new Promise((resolve, reject) => {
    const key = process.env.YOUTUBE_API_KEY;
    if (!key) return reject(new Error('YOUTUBE_API_KEY tanımlı değil'));
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
          if (!item) return reject(new Error(`"${query}" için sonuç bulunamadı`));
          resolve({
            id: item.id.videoId,
            title: item.snippet.title,
            uploader: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails?.medium?.url,
            webpage_url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
            duration: 0,
            is_live: false,
            view_count: 0,
          });
        } catch { reject(new Error('YouTube API yanıtı parse edilemedi')); }
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('YouTube API zaman aşımı')); });
    req.on('error', reject);
    req.end();
  });
}

// ─── yt-dlp ──────────────────────────────────────────────────────────────────

function buildArgs(extra = []) {
  const args = [
    '--no-warnings',
    '--socket-timeout', '20',
    '--retries', '2',
    '--extractor-args', 'youtube:player_client=tv,android,ios',
    ...extra,
  ];
  if (fs.existsSync(COOKIES_PATH)) args.push('--cookies', COOKIES_PATH);
  if (process.env.YTDLP_PROXY) args.push('--proxy', process.env.YTDLP_PROXY);
  return args;
}

function runYtdlp(args, timeoutMs = 45000) {
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

function ytdlpGetStreamUrl(songUrl, timeoutMs = 45000) {
  return new Promise((resolve, reject) => {
    const args = buildArgs(['--get-url', '-f', 'bestaudio/best', songUrl]);
    const proc = execFile(YTDLP_BIN, args, { maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
      clearTimeout(timer);
      if (err) return reject(new DisTubeError('YTDLP_ERROR', stderr?.trim() || err.message));
      const url = stdout.trim().split('\n')[0];
      if (!url) return reject(new DisTubeError('YTDLP_ERROR', 'Stream URL alınamadı'));
      resolve(url);
    });
    const timer = setTimeout(() => { proc.kill(); reject(new DisTubeError('YTDLP_ERROR', 'yt-dlp zaman aşımına uğradı')); }, timeoutMs);
  });
}

// ─── Yardımcılar ──────────────────────────────────────────────────────────────

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
        return await this._playlist(url, options);
      }

      return await this._video(url, options);
    } catch (err) {
      throw new DisTubeError('YTDLP_ERROR', err.message);
    }
  }

  async _search(query, options) {
    // 1. YouTube Data API (hızlı, IP sorunu yok)
    try {
      const data = await youtubeApiSearch(query);
      return this._makeSong(data, options);
    } catch (e) {
      console.warn('[YouTubePlugin] Data API başarısız, yt-dlp deneniyor:', e.message);
    }

    // 2. yt-dlp fallback
    const data = await runYtdlp(buildArgs([
      '--dump-json', '--skip-download', '--flat-playlist', `ytsearch1:${query}`,
    ]));
    const entry = data.entries?.[0] || data;
    if (!entry?.id) throw new Error(`"${query}" için sonuç bulunamadı`);
    return this._makeSong({ ...entry, webpage_url: `https://www.youtube.com/watch?v=${entry.id}` }, options);
  }

  async _video(url, options) {
    const data = await runYtdlp(buildArgs(['--dump-json', '--skip-download', url]));
    return this._makeSong(data, options);
  }

  async _playlist(url, options) {
    const data = await runYtdlp(buildArgs([
      '--dump-json', '--skip-download', '--flat-playlist', url,
    ]), 90000);
    const songs = (data.entries || []).map(e => this._makeSong({
      ...e,
      webpage_url: `https://www.youtube.com/watch?v=${e.id}`,
    }, options));
    return new Playlist({
      source: 'youtube',
      songs,
      id: data.id,
      name: data.title,
      url: data.webpage_url || url,
      thumbnail: data.thumbnail,
    }, options);
  }

  _makeSong(data, options) {
    return new Song({
      plugin: this,
      source: 'youtube',
      playFromSource: true,
      id: data.id,
      name: data.title || 'Bilinmeyen',
      url: data.webpage_url || `https://www.youtube.com/watch?v=${data.id}`,
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
    return ytdlpGetStreamUrl(song.url);
  }

  getRelatedSongs() { return []; }
}

module.exports = { YouTubePlugin };
