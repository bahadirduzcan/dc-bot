const { SlashCommandBuilder } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Müziği durdur ve kuyruktan çık'),

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
      await queue.stop();
      await interaction.reply({
        embeds: [createSuccessEmbed('⏹️ Durduruldu', 'Müzik durduruldu ve kuyruk temizlendi.')],
      });
    } catch (error) {
      await interaction.reply({
        embeds: [createErrorEmbed('Hata', 'Müzik durdurulamadı.')],
        ephemeral: true,
      });
    }
  },
};
