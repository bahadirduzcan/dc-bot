/**
 * @distube/yt-dlp plugin'ini patch'ler:
 * - noCallHome kaldırılır (deprecated uyarısını giderir)
 * - preferFreeFormats kaldırılır (format hatasını giderir)
 * - extractorArgs eklenir (YouTube bot korumasını atlatır)
 * - runtime'da /app/cookies.txt varsa otomatik kullanır
 * - runtime'da YTDLP_PROXY env varı varsa proxy kullanır
 */
const fs = require('fs');
const PLUGIN_PATH = require('path').join(__dirname, 'node_modules/@distube/yt-dlp/dist/index.js');

let content = fs.readFileSync(PLUGIN_PATH, 'utf-8');

const runtimeHelpers = `const _ytCookies = require('fs').existsSync('/app/cookies.txt') ? { cookies: '/app/cookies.txt' } : {};
    const _ytProxy = process.env.YTDLP_PROXY ? { proxy: process.env.YTDLP_PROXY } : {};`;

// resolve() metodunu patch'le
content = content.replace(
  `const info = await json(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      preferFreeFormats: true,
      skipDownload: true,
      simulate: true
    }).catch((e2) => {`,
  `${runtimeHelpers}
    const info = await json(url, {
      dumpSingleJson: true,
      noWarnings: true,
      skipDownload: true,
      simulate: true,
      extractorArgs: 'youtube:player_client=ios,mweb',
      ..._ytCookies,
      ..._ytProxy
    }).catch((e2) => {`
);

// getStreamURL() metodunu patch'le
content = content.replace(
  `const info = await json(song.url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      preferFreeFormats: true,
      skipDownload: true,
      simulate: true,
      format: "ba/ba*"
    }).catch((e2) => {`,
  `${runtimeHelpers}
    const info = await json(song.url, {
      dumpSingleJson: true,
      noWarnings: true,
      skipDownload: true,
      simulate: true,
      format: "ba/ba*",
      extractorArgs: 'youtube:player_client=ios,mweb',
      ..._ytCookies,
      ..._ytProxy
    }).catch((e2) => {`
);

if (!content.includes('extractorArgs')) {
  console.error('[patch-yt-dlp] HATA: Patch uygulanamadı, plugin kaynak kodu beklenenden farklı!');
  process.exit(1);
}

fs.writeFileSync(PLUGIN_PATH, content);
console.log('[patch-yt-dlp] Plugin başarıyla patch edildi.');
