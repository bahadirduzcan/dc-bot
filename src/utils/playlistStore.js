const { readJSON, writeJSON } = require('./dataStore');

function savePlaylist(guildId, userId, name, songs) {
  const data = readJSON('playlists.json');
  if (!data[guildId]) data[guildId] = {};
  data[guildId][name] = {
    name,
    createdBy: userId,
    createdAt: Date.now(),
    songs: songs.map(s => ({ name: s.name, url: s.url, duration: s.formattedDuration })),
  };
  writeJSON('playlists.json', data);
}

function getPlaylists(guildId) {
  const data = readJSON('playlists.json');
  return data[guildId] || {};
}

module.exports = { savePlaylist, getPlaylists };
