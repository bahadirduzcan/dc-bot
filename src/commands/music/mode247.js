const { SlashCommandBuilder } = require('discord.js');
const { createSuccessEmbed } = require('../../utils/embed');
const { toggle247Mode, is247Mode } = require('../../utils/settingsStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('247')
    .setDescription('7/24 kanalda kal modunu aç/kapat (kimse olmasa bile ayrılma)'),

  async execute(interaction) {
    const enabled = toggle247Mode(interaction.guildId);
    const status = enabled ? '✅ Açık' : '❌ Kapalı';
    const desc = enabled
      ? 'Bot artık kimse olmasa bile ses kanalında kalacak.'
      : 'Bot artık kimse kalmayınca 5 dakika sonra ayrılacak.';

    await interaction.reply({
      embeds: [createSuccessEmbed(`🕐 7/24 Mod: ${status}`, desc)],
    });
  },
};
