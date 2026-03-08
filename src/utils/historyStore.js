const { readJSON, writeJSON } = require('./dataStore');

function addToHistory(guildId, song) {
  const data = readJSON('history.json');
  if (!data[guildId]) data[guildId] = [];
  data[guildId].unshift({
    name: song.name,
    url: song.url,
    duration: song.formattedDuration,
    thumbnail: song.thumbnail,
    requestedBy: song.user?.tag || 'Bilinmiyor',
    playedAt: Date.now(),
  });
  data[guildId] = data[guildId].slice(0, 20);
  writeJSON('history.json', data);
}

function getHistory(guildId) {
  const data = readJSON('history.json');
  return data[guildId] || [];
}

module.exports = { addToHistory, getHistory };
