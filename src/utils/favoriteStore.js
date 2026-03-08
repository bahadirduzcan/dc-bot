const { readJSON, writeJSON } = require('./dataStore');

function addFavorite(userId, song) {
  const data = readJSON('favorites.json');
  if (!data[userId]) data[userId] = [];
  if (data[userId].find(s => s.url === song.url)) return false;
  data[userId].push({
    name: song.name,
    url: song.url,
    duration: song.formattedDuration,
    addedAt: Date.now(),
  });
  writeJSON('favorites.json', data);
  return true;
}

function removeFavorite(userId, index) {
  const data = readJSON('favorites.json');
  if (!data[userId] || !data[userId][index]) return false;
  data[userId].splice(index, 1);
  writeJSON('favorites.json', data);
  return true;
}

function getFavorites(userId) {
  const data = readJSON('favorites.json');
  return data[userId] || [];
}

module.exports = { addFavorite, removeFavorite, getFavorites };
