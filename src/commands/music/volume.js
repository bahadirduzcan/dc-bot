const { SlashCommandBuilder } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embed');
const { setVolume } = require('../../utils/volumeStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Ses seviyesini ayarla')
    .addIntegerOption(option =>
      option
        .setName('seviye')
        .setDescription('Ses seviyesi (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    ),

  async execute(interaction) {
    const distube = interaction.client.distube;
    const queue = distube.getQueue(interaction.guildId);
    const volume = interaction.options.getInteger('seviye');

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
      queue.setVolume(volume);
      setVolume(interaction.guildId, volume);
      const emoji = volume >= 70 ? '🔊' : volume >= 30 ? '🔉' : '🔈';
      await interaction.reply({
        embeds: [createSuccessEmbed(`${emoji} Ses Ayarlandı`, `Ses seviyesi **%${volume}** olarak ayarlandı.`)],
      });
    } catch (error) {
      await interaction.reply({
        embeds: [createErrorEmbed('Hata', 'Ses seviyesi ayarlanamadı.')],
        ephemeral: true,
      });
    }
  },
};
