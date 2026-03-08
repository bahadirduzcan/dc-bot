const { SlashCommandBuilder } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Kuyruktan şarkı kaldır')
    .addIntegerOption(option =>
      option
        .setName('sira')
        .setDescription('Kuyruk sırası (1 = sonraki şarkı)')
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction) {
    const distube = interaction.client.distube;
    const queue = distube.getQueue(interaction.guildId);
    const position = interaction.options.getInteger('sira');

    if (!queue || queue.songs.length <= 1) {
      return interaction.reply({
        embeds: [createErrorEmbed('Kuyruk Boş', 'Kuyrukta kaldırılacak şarkı yok!')],
        ephemeral: true,
      });
    }

    if (!interaction.member.voice.channel) {
      return interaction.reply({
        embeds: [createErrorEmbed('Ses Kanalı Gerekli', 'Ses kanalında olman gerekiyor!')],
        ephemeral: true,
      });
    }

    if (position >= queue.songs.length) {
      return interaction.reply({
        embeds: [createErrorEmbed('Geçersiz Sıra', `Kuyrukta ${queue.songs.length - 1} şarkı var. 1-${queue.songs.length - 1} arası bir değer gir.`)],
        ephemeral: true,
      });
    }

    try {
      const removedSong = queue.songs[position];
      queue.songs.splice(position, 1);
      await interaction.reply({
        embeds: [createSuccessEmbed('🗑️ Kaldırıldı', `**${removedSong.name}** kuyruktan kaldırıldı.`)],
      });
    } catch (error) {
      await interaction.reply({
        embeds: [createErrorEmbed('Hata', 'Şarkı kaldırılamadı.')],
        ephemeral: true,
      });
    }
  },
};
