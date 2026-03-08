/**
 * @distube/yt-dlp plugin minimal patch:
 * - noCallHome kaldırılır (deprecated uyarısını giderir)
 * - Proxy desteği eklenir (YTDLP_PROXY env var)
 * YouTube artık YouTubePlugin (play-dl) tarafından işleniyor.
 */
const fs = require('fs');
const PLUGIN_PATH = require('path').join(__dirname, 'node_modules/@distube/yt-dlp/dist/index.js');

let content = fs.readFileSync(PLUGIN_PATH, 'utf-8');

const proxyHelper = `const _ytProxy = process.env.YTDLP_PROXY ? { proxy: process.env.YTDLP_PROXY } : {};`;

const resolveOld = `const info = await json(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      preferFreeFormats: true,
      skipDownload: true,
      simulate: true
    }).catch((e2) => {`;

const resolveNew = `${proxyHelper}
    const info = await json(url, {
      dumpSingleJson: true,
      noWarnings: true,
      skipDownload: true,
      simulate: true,
      ..._ytProxy
    }).catch((e2) => {`;

const streamOld = `const info = await json(song.url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      preferFreeFormats: true,
      skipDownload: true,
      simulate: true,
      format: "ba/ba*"
    }).catch((e2) => {`;

const streamNew = `${proxyHelper}
    const info = await json(song.url, {
      dumpSingleJson: true,
      noWarnings: true,
      skipDownload: true,
      simulate: true,
      format: "bestaudio/best",
      ..._ytProxy
    }).catch((e2) => {`;

if (!content.includes(resolveOld)) {
  console.error('[patch-yt-dlp] HATA: resolve() patch string bulunamadı!');
  process.exit(1);
}
if (!content.includes(streamOld)) {
  console.error('[patch-yt-dlp] HATA: getStreamURL() patch string bulunamadı!');
  process.exit(1);
}

content = content.replace(resolveOld, resolveNew);
content = content.replace(streamOld, streamNew);

fs.writeFileSync(PLUGIN_PATH, content);
console.log('[patch-yt-dlp] Plugin patch edildi (non-YouTube sources için).');
