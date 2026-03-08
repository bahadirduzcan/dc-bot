const { SlashCommandBuilder } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clearqueue')
    .setDescription('Kuyruğu temizle (çalan şarkı devam eder)'),

  async execute(interaction) {
    const queue = interaction.client.distube.getQueue(interaction.guildId);

    if (!queue) {
      return interaction.reply({ embeds: [createErrorEmbed('Kuyruk Yok', 'Şu an çalan bir şarkı yok!')], ephemeral: true });
    }

    const count = queue.songs.length - 1;
    if (count === 0) {
      return interaction.reply({ embeds: [createErrorEmbed('Kuyruk Boş', 'Kuyrukta başka şarkı yok.')], ephemeral: true });
    }

    queue.songs.splice(1);

    await interaction.reply({
      embeds: [createSuccessEmbed('🗑️ Kuyruk Temizlendi', `${count} şarkı kuyruktan silindi. Mevcut şarkı çalmaya devam ediyor.`)],
    });
  },
};
