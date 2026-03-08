const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createErrorEmbed } = require('../../utils/embed');
const { formatDuration } = require('../../utils/helpers');

const SONGS_PER_PAGE = 10;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Şarkı kuyruğunu göster')
    .addIntegerOption(option =>
      option
        .setName('sayfa')
        .setDescription('Sayfa numarası')
        .setMinValue(1)
    ),

  async execute(interaction) {
    const distube = interaction.client.distube;
    const queue = distube.getQueue(interaction.guildId);

    if (!queue || queue.songs.length === 0) {
      return interaction.reply({
        embeds: [createErrorEmbed('Kuyruk Boş', 'Şu an kuyrukta şarkı yok!')],
        ephemeral: true,
      });
    }

    const page = interaction.options.getInteger('sayfa') || 1;
    const totalPages = Math.ceil(queue.songs.length / SONGS_PER_PAGE);
    const currentPage = Math.min(page, totalPages);

    const embed = buildQueueEmbed(queue, currentPage, totalPages);

    await interaction.reply({ embeds: [embed] });
  },
};

module.exports.buildQueueEmbed = buildQueueEmbed;

function buildQueueEmbed(queue, page, totalPages) {
  const start = (page - 1) * SONGS_PER_PAGE;
  const end = start + SONGS_PER_PAGE;
  const songs = queue.songs.slice(start, end);

  const songList = songs.map((song, index) => {
    const globalIndex = start + index;
    const prefix = globalIndex === 0 ? '🎵 **Çalıyor:**' : `\`${globalIndex}.\``;
    return `${prefix} [${song.name}](${song.url}) \`${song.formattedDuration}\``;
  }).join('\n');

  const totalDuration = queue.songs.reduce((acc, song) => acc + (song.duration || 0), 0);

  return new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('🎶 Müzik Kuyruğu')
    .setDescription(songList || 'Kuyruk boş')
    .addFields(
      { name: 'Toplam Şarkı', value: `${queue.songs.length} şarkı`, inline: true },
      { name: 'Toplam Süre', value: formatDuration(totalDuration), inline: true },
      { name: 'Döngü', value: queue.repeatMode === 0 ? 'Kapalı' : queue.repeatMode === 1 ? 'Şarkı' : 'Kuyruk', inline: true },
    )
    .setFooter({ text: `Sayfa ${page}/${totalPages} • Ses: ${queue.volume}%` })
    .setTimestamp();
}
