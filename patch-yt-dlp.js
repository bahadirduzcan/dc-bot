/**
 * @distube/yt-dlp plugin'ini patch'ler:
 * - noCallHome kaldırılır (deprecated uyarısını giderir)
 * - preferFreeFormats kaldırılır (format hatasını giderir)
 * - runtime'da /app/cookies.txt varsa otomatik kullanır (auth için)
 * - runtime'da YTDLP_PROXY env varı varsa proxy kullanır
 */
const fs = require('fs');
const PLUGIN_PATH = require('path').join(__dirname, 'node_modules/@distube/yt-dlp/dist/index.js');

let content = fs.readFileSync(PLUGIN_PATH, 'utf-8');

const runtimeHelpers = `const _ytCookies = require('fs').existsSync('/app/cookies.txt') ? { cookies: '/app/cookies.txt' } : {};
    const _ytProxy = process.env.YTDLP_PROXY ? { proxy: process.env.YTDLP_PROXY } : {};`;

// resolve() metodunu patch'le
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
      simulate: true,
      ..._ytCookies,
      ..._ytProxy
    }).catch((e2) => {`;

// getStreamURL() metodunu patch'le
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
      simulate: true,
      format: "ba/ba*",
      ..._ytCookies,
      ..._ytProxy
    }).catch((e2) => {`;

if (!content.includes(resolveOld)) {
  console.error('[patch-yt-dlp] HATA: resolve() için patch string bulunamadı!');
  process.exit(1);
}
if (!content.includes(streamOld)) {
  console.error('[patch-yt-dlp] HATA: getStreamURL() için patch string bulunamadı!');
  process.exit(1);
}

content = content.replace(resolveOld, resolveNew);
content = content.replace(streamOld, streamNew);

fs.writeFileSync(PLUGIN_PATH, content);
console.log('[patch-yt-dlp] Plugin başarıyla patch edildi.');
