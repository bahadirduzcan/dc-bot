const { SlashCommandBuilder } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Kuyruğu karıştır'),

  async execute(interaction) {
    const distube = interaction.client.distube;
    const queue = distube.getQueue(interaction.guildId);

    if (!queue || queue.songs.length <= 1) {
      return interaction.reply({
        embeds: [createErrorEmbed('Yetersiz Şarkı', 'Karıştırmak için kuyrukta en az 2 şarkı olmalı!')],
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
      queue.shuffle();
      await interaction.reply({
        embeds: [createSuccessEmbed('🔀 Karıştırıldı', `${queue.songs.length - 1} şarkı rastgele sıralandı.`)],
      });
    } catch (error) {
      await interaction.reply({
        embeds: [createErrorEmbed('Hata', 'Kuyruk karıştırılamadı.')],
        ephemeral: true,
      });
    }
  },
};
