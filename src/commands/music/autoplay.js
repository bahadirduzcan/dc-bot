const { SlashCommandBuilder } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autoplay')
    .setDescription('Otomatik şarkı önerisini aç/kapat'),

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

    try {
      const newState = !queue.autoplay;
      queue.toggleAutoplay();
      await interaction.reply({
        embeds: [createSuccessEmbed(
          `🤖 Autoplay ${newState ? 'Açıldı' : 'Kapatıldı'}`,
          `Otomatik şarkı önerisi **${newState ? 'açık' : 'kapalı'}**.`
        )],
      });
    } catch (error) {
      await interaction.reply({
        embeds: [createErrorEmbed('Hata', 'Autoplay durumu değiştirilemedi.')],
        ephemeral: true,
      });
    }
  },
};
