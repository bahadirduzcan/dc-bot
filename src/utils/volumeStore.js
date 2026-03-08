const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', '..', 'data', 'volumes.json');

function load() {
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    return {};
  }
}

function save(data) {
  try {
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
  } catch {}
}

function getVolume(guildId) {
  const data = load();
  return data[guildId] ?? 100;
}

function setVolume(guildId, volume) {
  const data = load();
  data[guildId] = volume;
  save(data);
}

module.exports = { getVolume, setVolume };
