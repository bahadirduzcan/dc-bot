const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createErrorEmbed } = require('../../utils/embed');
const { getFavorites } = require('../../utils/favoriteStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('favorites')
    .setDescription('Favori şarkılarını listele'),

  async execute(interaction) {
    const favorites = getFavorites(interaction.user.id);

    if (!favorites.length) {
      return interaction.reply({ embeds: [createErrorEmbed('Favori Yok', 'Henüz favori şarkın yok. `/favorite` ile ekleyebilirsin.')], ephemeral: true });
    }

    const list = favorites
      .slice(0, 20)
      .map((s, i) => `**${i + 1}.** [${s.name}](${s.url}) \`${s.duration}\``)
      .join('\n');

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xFF6B9D)
          .setTitle(`❤️ ${interaction.user.displayName} - Favoriler`)
          .setDescription(list)
          .setFooter({ text: `${favorites.length} favori şarkı` })
          .setTimestamp(),
      ],
      ephemeral: true,
    });
  },
};
