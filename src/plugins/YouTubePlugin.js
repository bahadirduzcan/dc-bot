const { PlayableExtractorPlugin, Song, Playlist, DisTubeError } = require('distube');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const YTDLP_BIN = path.join(__dirname, '../../node_modules/@distube/yt-dlp/bin/yt-dlp');
const COOKIES_PATH = process.env.YOUTUBE_COOKIES_PATH || '/app/cookies.txt';

function isYouTubeUrl(str) {
  return /youtube\.com|youtu\.be/i.test(str);
}

function isUrl(str) {
  return /^https?:\/\//i.test(str);
}

function buildArgs(extra = []) {
  const args = [
    '--no-warnings',
    '--extractor-args', 'youtube:player_client=ios,web',
    ...extra,
  ];
  if (fs.existsSync(COOKIES_PATH)) {
    args.push('--cookies', COOKIES_PATH);
  }
  if (process.env.YTDLP_PROXY) {
    args.push('--proxy', process.env.YTDLP_PROXY);
  }
  return args;
}

function runYtDlp(args) {
  return new Promise((resolve, reject) => {
    execFile(YTDLP_BIN, args, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(stderr?.trim() || err.message));
      }
      try {
        resolve(JSON.parse(stdout));
      } catch {
        reject(new Error('yt-dlp çıktısı parse edilemedi'));
      }
    });
  });
}

function getStreamUrl(songUrl) {
  return new Promise((resolve, reject) => {
    const args = buildArgs([
      '--get-url',
      '-f', 'bestaudio/best',
      songUrl,
    ]);
    execFile(YTDLP_BIN, args, { maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) return reject(new DisTubeError('YTDLP_ERROR', stderr?.trim() || err.message));
      const url = stdout.trim().split('\n')[0];
      if (!url) return reject(new DisTubeError('YTDLP_ERROR', 'Stream URL alınamadı'));
      resolve(url);
    });
  });
}

class YouTubePlugin extends PlayableExtractorPlugin {
  validate(url) {
    return isYouTubeUrl(url) || !isUrl(url);
  }

  async resolve(url, options) {
    try {
      if (!isUrl(url)) {
        return await this._search(url, options);
      }
      if (/[?&]list=/.test(url) && !/[?&]list=RD/.test(url)) {
        return await this._playlist(url, options);
      }
      return await this._video(url, options);
    } catch (err) {
      throw new DisTubeError('YTDLP_ERROR', err.message);
    }
  }

  async _search(query, options) {
    const data = await runYtDlp(buildArgs([
      '--dump-json',
      '--skip-download',
      '--flat-playlist',
      `ytsearch1:${query}`,
    ]));
    const entry = data.entries?.[0] || data;
    if (!entry?.id) throw new Error(`"${query}" için sonuç bulunamadı`);
    return this._makeSong(entry, options);
  }

  async _video(url, options) {
    const data = await runYtDlp(buildArgs([
      '--dump-json',
      '--skip-download',
      url,
    ]));
    return this._makeSong(data, options);
  }

  async _playlist(url, options) {
    const data = await runYtDlp(buildArgs([
      '--dump-json',
      '--skip-download',
      '--flat-playlist',
      url,
    ]));
    const songs = (data.entries || []).map(e => this._makeSong(e, options));
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
    const videoUrl = data.webpage_url || `https://www.youtube.com/watch?v=${data.id}`;
    return new Song({
      plugin: this,
      source: 'youtube',
      playFromSource: true,
      id: data.id,
      name: data.title || 'Bilinmeyen',
      url: videoUrl,
      isLive: data.is_live || false,
      thumbnail: data.thumbnail,
      duration: data.duration || 0,
      uploader: { name: data.uploader || data.channel, url: data.uploader_url || data.channel_url },
      views: data.view_count || 0,
    }, options);
  }

  async getStreamURL(song) {
    return getStreamUrl(song.url);
  }

  getRelatedSongs() {
    return [];
  }
}

module.exports = { YouTubePlugin };
