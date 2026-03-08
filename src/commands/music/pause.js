const { SlashCommandBuilder } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Müziği duraklat'),

  async execute(interaction) {
    const distube = interaction.client.distube;
    const queue = distube.getQueue(interaction.guildId);

    if (!queue) {
      return interaction.reply({
        embeds: [createErrorEmbed('Kuyruk Yok', 'Şu an çalan bir şarkı yok!')],
        ephemeral: true,
      });
    }

    if (!interaction.member.voice.channel) {
      return interaction.reply({
        embeds: [createErrorEmbed('Ses Kanalı Gerekli', 'Ses kanalında olman gerekiyor!')],
        ephemeral: true,
      });
    }

    if (queue.paused) {
      return interaction.reply({
        embeds: [createErrorEmbed('Zaten Duraklatıldı', 'Müzik zaten duraklatılmış. `/resume` kullan.')],
        ephemeral: true,
      });
    }

    try {
      await queue.pause();
      await interaction.reply({
        embeds: [createSuccessEmbed('⏸️ Duraklatıldı', `**${queue.songs[0].name}** duraklatıldı.`)],
      });
    } catch (error) {
      await interaction.reply({
        embeds: [createErrorEmbed('Hata', 'Müzik duraksatılamadı.')],
        ephemeral: true,
      });
    }
  },
};
