/**
 * Progress bar oluşturur
 * @param {number} current - Mevcut süre (saniye)
 * @param {number} total - Toplam süre (saniye)
 * @param {number} length - Bar uzunluğu (karakter)
 */
function createProgressBar(current, total, length = 20) {
  if (!total || total === 0) return '▬'.repeat(length);

  const progress = Math.min(current / total, 1);
  const filled = Math.round(progress * length);
  const empty = length - filled;

  return '▬'.repeat(Math.max(0, filled - 1)) + '🔘' + '▬'.repeat(Math.max(0, empty));
}

/**
 * Saniyeyi okunabilir formata çevirir (örn: 1:23:45 veya 3:45)
 */
function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Metni belirli uzunlukta keser
 */
function truncate(text, maxLength = 50) {
  if (!text) return '';
  return text.length > maxLength ? text.slice(0, maxLength - 3) + '...' : text;
}

/**
 * Kullanıcının bot ile aynı ses kanalında olup olmadığını kontrol eder
 */
function checkSameVoiceChannel(interaction) {
  const userVoice = interaction.member.voice.channel;
  const botVoice = interaction.guild.members.me?.voice.channel;

  if (!userVoice) return { ok: false, reason: 'Ses kanalında değilsin!' };
  if (botVoice && botVoice.id !== userVoice.id) return { ok: false, reason: 'Benimle aynı ses kanalında olmalısın!' };
  return { ok: true };
}

module.exports = {
  createProgressBar,
  formatDuration,
  truncate,
  checkSameVoiceChannel,
};
