/**
 * @distube/yt-dlp plugin'ini patch'ler:
 * - noCallHome kaldırılır (deprecated uyarısını giderir)
 * - preferFreeFormats kaldırılır
 * - resolve() sadece metadata alır, format seçmez
 * - getStreamURL() esnek format selector kullanır
 * - YTDLP_PROXY env varı ile proxy kullanır (sunucu IP engeli için zorunlu)
 * - /app/cookies.txt varsa cookie kullanır
 */
const fs = require('fs');
const PLUGIN_PATH = require('path').join(__dirname, 'node_modules/@distube/yt-dlp/dist/index.js');

let content = fs.readFileSync(PLUGIN_PATH, 'utf-8');

const runtimeHelpers = `const _ytCookies = require('fs').existsSync('/app/cookies.txt') ? { cookies: '/app/cookies.txt' } : {};
    const _ytProxy = process.env.YTDLP_PROXY ? { proxy: process.env.YTDLP_PROXY } : {};`;

// resolve() — sadece metadata, format seçimi yok
const resolveOld = `const info = await json(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      preferFreeFormats: true,
      skipDownload: true,
      simulate: true
    }).catch((e2) => {`;

const resolveNew = `${runtimeHelpers}
    const info = await json(url, {
      dumpSingleJson: true,
      noWarnings: true,
      skipDownload: true,
      ..._ytCookies,
      ..._ytProxy
    }).catch((e2) => {`;

// getStreamURL() — esnek format, tüm senaryoları kapsar
const streamOld = `const info = await json(song.url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      preferFreeFormats: true,
      skipDownload: true,
      simulate: true,
      format: "ba/ba*"
    }).catch((e2) => {`;

const streamNew = `${runtimeHelpers}
    const info = await json(song.url, {
      dumpSingleJson: true,
      noWarnings: true,
      skipDownload: true,
      format: "bestaudio[ext=webm]/bestaudio[ext=m4a]/bestaudio/best",
      ..._ytCookies,
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
console.log('[patch-yt-dlp] Plugin başarıyla patch edildi.');
