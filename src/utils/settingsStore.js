const { readJSON, writeJSON } = require('./dataStore');

function getSetting(guildId, key) {
  const data = readJSON('settings.json');
  return data[guildId]?.[key];
}

function setSetting(guildId, key, value) {
  const data = readJSON('settings.json');
  if (!data[guildId]) data[guildId] = {};
  data[guildId][key] = value;
  writeJSON('settings.json', data);
}

function getDJRole(guildId) {
  return getSetting(guildId, 'djRole');
}

function setDJRole(guildId, roleId) {
  setSetting(guildId, 'djRole', roleId);
}

function removeDJRole(guildId) {
  setSetting(guildId, 'djRole', null);
}

function getAnnounceChannel(guildId) {
  return getSetting(guildId, 'announceChannel');
}

function setAnnounceChannel(guildId, channelId) {
  setSetting(guildId, 'announceChannel', channelId);
}

function removeAnnounceChannel(guildId) {
  setSetting(guildId, 'announceChannel', null);
}

function getBlacklist(guildId) {
  return getSetting(guildId, 'blacklist') || [];
}

function addToBlacklist(guildId, userId) {
  const list = getBlacklist(guildId);
  if (list.includes(userId)) return false;
  list.push(userId);
  setSetting(guildId, 'blacklist', list);
  return true;
}

function removeFromBlacklist(guildId, userId) {
  const list = getBlacklist(guildId);
  const idx = list.indexOf(userId);
  if (idx === -1) return false;
  list.splice(idx, 1);
  setSetting(guildId, 'blacklist', list);
  return true;
}

function isBlacklisted(guildId, userId) {
  return getBlacklist(guildId).includes(userId);
}

function is247Mode(guildId) {
  return getSetting(guildId, 'mode247') === true;
}

function toggle247Mode(guildId) {
  const current = is247Mode(guildId);
  setSetting(guildId, 'mode247', !current);
  return !current;
}

module.exports = {
  getDJRole, setDJRole, removeDJRole,
  is247Mode, toggle247Mode,
  getAnnounceChannel, setAnnounceChannel, removeAnnounceChannel,
  getBlacklist, addToBlacklist, removeFromBlacklist, isBlacklisted,
};
