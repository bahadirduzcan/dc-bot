/**
 * @distube/yt-dlp plugin'ini patch'ler:
 * - noCallHome kaldırılır (deprecated uyarısını giderir)
 * - extractorArgs eklenir (YouTube bot korumasını atlatır)
 * - /app/cookies.txt varsa otomatik kullanır (runtime'da entrypoint.sh tarafından yazılır)
 */
const fs = require('fs');
const PLUGIN_PATH = require('path').join(__dirname, 'node_modules/@distube/yt-dlp/dist/index.js');

let content = fs.readFileSync(PLUGIN_PATH, 'utf-8');

const cookiesHelper = `const _ytCookies = require('fs').existsSync('/app/cookies.txt') ? { cookies: '/app/cookies.txt' } : {};`;

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
  `${cookiesHelper}
    const info = await json(url, {
      dumpSingleJson: true,
      noWarnings: true,
      preferFreeFormats: true,
      skipDownload: true,
      simulate: true,
      extractorArgs: 'youtube:player_client=ios,mweb',
      ..._ytCookies
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
  `${cookiesHelper}
    const info = await json(song.url, {
      dumpSingleJson: true,
      noWarnings: true,
      preferFreeFormats: true,
      skipDownload: true,
      simulate: true,
      format: "ba/ba*",
      extractorArgs: 'youtube:player_client=ios,mweb',
      ..._ytCookies
    }).catch((e2) => {`
);

fs.writeFileSync(PLUGIN_PATH, content);
console.log('[patch-yt-dlp] Plugin başarıyla patch edildi.');
