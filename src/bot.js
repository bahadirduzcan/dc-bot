const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { DisTube } = require('distube');
const { YtDlpPlugin } = require('@distube/yt-dlp');
const { SpotifyPlugin } = require('@distube/spotify');
const { SoundCloudPlugin } = require('@distube/soundcloud');
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');
const { setupMusicEvents } = require('./handlers/musicHandler');
const fs = require('fs');

const COOKIES_PATH = '/app/cookies.txt';

function createBot() {
  // Discord Client oluştur
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.MessageContent,
    ],
  });

  // Komutlar için Collection
  client.commands = new Collection();

  // Cookie dosyası varsa yt-dlp'ye ver
  const ytdlpOptions = fs.existsSync(COOKIES_PATH)
    ? { cookies: COOKIES_PATH }
    : {};

  // DisTube setup
  client.distube = new DisTube(client, {
    emitNewSongOnly: false,
    emitAddSongWhenCreatingQueue: true,
    emitAddListWhenCreatingQueue: true,
    nsfw: false,
    plugins: [
      new YtDlpPlugin({ update: false, ytdlpOptions }),
      new SpotifyPlugin(),
      new SoundCloudPlugin(),
    ],
  });

  // Handler'ları yükle
  loadCommands(client);
  loadEvents(client);
  setupMusicEvents(client);

  return client;
}

module.exports = { createBot };
