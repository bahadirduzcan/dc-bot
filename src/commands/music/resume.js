const { SlashCommandBuilder } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Duraklatılan müziği devam ettir'),

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

    if (!queue.paused) {
      return interaction.reply({
        embeds: [createErrorEmbed('Zaten Çalıyor', 'Müzik zaten çalıyor!')],
        ephemeral: true,
      });
    }

    try {
      await queue.resume();
      await interaction.reply({
        embeds: [createSuccessEmbed('▶️ Devam Edildi', `**${queue.songs[0].name}** devam ediyor.`)],
      });
    } catch (error) {
      await interaction.reply({
        embeds: [createErrorEmbed('Hata', 'Müzik devam ettirilemedi.')],
        ephemeral: true,
      });
    }
  },
};
