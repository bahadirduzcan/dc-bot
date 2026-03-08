const intervals = new Map();

function setLive(guildId, intervalId) {
  clearLive(guildId);
  intervals.set(guildId, intervalId);
}

function clearLive(guildId) {
  if (intervals.has(guildId)) {
    clearInterval(intervals.get(guildId));
    intervals.delete(guildId);
  }
}

module.exports = { setLive, clearLive };
