const { SlashCommandBuilder } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embed');
const { addFavorite } = require('../../utils/favoriteStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('favorite')
    .setDescription('Şu an çalan şarkıyı favorilere ekle'),

  async execute(interaction) {
    const queue = interaction.client.distube.getQueue(interaction.guildId);

    if (!queue?.songs[0]) {
      return interaction.reply({ embeds: [createErrorEmbed('Çalmıyor', 'Şu an çalan bir şarkı yok!')], ephemeral: true });
    }

    const song = queue.songs[0];
    const added = addFavorite(interaction.user.id, song);

    if (!added) {
      return interaction.reply({ embeds: [createErrorEmbed('Zaten Var', `**${song.name}** zaten favorilerinizde!`)], ephemeral: true });
    }

    await interaction.reply({
      embeds: [createSuccessEmbed('❤️ Favorilere Eklendi', `**${song.name}** favorilerine eklendi.`)],
      ephemeral: true,
    });
  },
};
