require('dotenv').config();
const { createBot } = require('./bot');

const bot = createBot();

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
