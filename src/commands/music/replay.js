const { SlashCommandBuilder } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('replay')
    .setDescription('Şarkıyı baştan başlat'),

  async execute(interaction) {
    const queue = interaction.client.distube.getQueue(interaction.guildId);

    if (!queue?.songs[0]) {
      return interaction.reply({ embeds: [createErrorEmbed('Çalmıyor', 'Şu an çalan bir şarkı yok!')], ephemeral: true });
    }

    try {
      await queue.seek(0);
      await interaction.reply({
        embeds: [createSuccessEmbed('🔄 Başa Sarıldı', `**${queue.songs[0].name}** baştan başlatıldı.`)],
      });
    } catch {
      await interaction.reply({ embeds: [createErrorEmbed('Hata', 'Şarkı başa sarılamadı.')], ephemeral: true });
    }
  },
};
