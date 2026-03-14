require('dotenv').config();
const http = require('http');
const EventEmitter = require('events');
// WebSocketShard listener uyarısını önle
EventEmitter.defaultMaxListeners = 20;
const { createBot } = require('./bot');

const bot = createBot();

// Coolify / Docker health check için basit HTTP server
const HEALTH_PORT = process.env.HEALTH_PORT || 3000;
http.createServer((req, res) => {
  if (req.url === '/health') {
    const isReady = bot.isReady();
    res.writeHead(isReady ? 200 : 503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: isReady ? 'ok' : 'starting', uptime: process.uptime() }));
  } else {
    res.writeHead(404);
    res.end();
  }
}).listen(HEALTH_PORT, () => {
  console.log(`[Health] HTTP health check sunucusu :${HEALTH_PORT}/health adresinde çalışıyor.`);
});

// Hata yönetimi
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Promise Rejection:', error);
});

process.on('uncaughtException', (error) => {
  // Discord API hataları (süresi geçmiş etkileşim vs.) botu çökertmemeli
  if (error.code === 10062 || error.code === 40060 || error.name === 'DiscordAPIError') {
    console.warn('[Discord API]', error.message);
    return;
  }
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

bot.login(process.env.DISCORD_TOKEN);
