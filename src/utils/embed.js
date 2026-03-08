const { EmbedBuilder } = require('discord.js');
const { createProgressBar } = require('./helpers');

/**
 * Hata embed'i oluşturur
 */
function createErrorEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(0xED4245)
    .setTitle(`❌ ${title}`)
    .setDescription(description)
    .setTimestamp();
}

/**
 * Başarı embed'i oluşturur
 */
function createSuccessEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(0x57F287)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
}

/**
 * Bilgi mesajı için embed oluşturur
 */
function createInfoEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(0xFEE75C)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
}

/**
 * Şu an çalan şarkı embed'i oluşturur (progress bar dahil)
 */
function createNowPlayingEmbed(song, queue) {
  const currentTime = queue.currentTime || 0;
  const totalTime = song.duration || 0;
  const progressBar = createProgressBar(currentTime, totalTime, 20);

  const currentFormatted = formatTime(currentTime);
  const totalFormatted = song.formattedDuration;

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('🎵 Şu An Çalıyor')
    .setDescription(`**[${song.name}](${song.url})**`)
    .addFields(
      {
        name: 'İlerleme',
        value: `\`${currentFormatted}\` ${progressBar} \`${totalFormatted}\``,
        inline: false,
      },
      { name: '👤 İsteyen', value: song.user?.toString() || 'Bilinmiyor', inline: true },
      { name: '🔊 Ses', value: `%${queue.volume}`, inline: true },
      {
        name: '🔁 Döngü',
        value: queue.repeatMode === 0 ? 'Kapalı' : queue.repeatMode === 1 ? 'Şarkı' : 'Kuyruk',
        inline: true,
      },
    )
    .setTimestamp();

  if (song.thumbnail) {
    embed.setThumbnail(song.thumbnail);
  }

  if (queue.songs.length > 1) {
    embed.setFooter({
      text: `Sırada: ${queue.songs[1]?.name || 'Yok'} • Toplam: ${queue.songs.length} şarkı`,
    });
  }

  return embed;
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

module.exports = {
  createErrorEmbed,
  createSuccessEmbed,
  createInfoEmbed,
  createNowPlayingEmbed,
};
