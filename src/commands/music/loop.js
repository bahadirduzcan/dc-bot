const { SlashCommandBuilder } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embed');
const { RepeatMode } = require('distube');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Döngü modunu ayarla')
    .addStringOption(option =>
      option
        .setName('mod')
        .setDescription('Döngü modu')
        .setRequired(true)
        .addChoices(
          { name: '❌ Kapalı', value: 'off' },
          { name: '🔂 Şarkı', value: 'song' },
          { name: '🔁 Kuyruk', value: 'queue' },
        )
    ),

  async execute(interaction) {
    const distube = interaction.client.distube;
    const queue = distube.getQueue(interaction.guildId);
    const mode = interaction.options.getString('mod');

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

    const modeMap = {
      off: RepeatMode.DISABLED,
      song: RepeatMode.SONG,
      queue: RepeatMode.QUEUE,
    };

    const modeNames = {
      off: '❌ Döngü Kapalı',
      song: '🔂 Şarkı Döngüsü',
      queue: '🔁 Kuyruk Döngüsü',
    };

    try {
      queue.setRepeatMode(modeMap[mode]);
      await interaction.reply({
        embeds: [createSuccessEmbed('Döngü Modu', `${modeNames[mode]} olarak ayarlandı.`)],
      });
    } catch (error) {
      await interaction.reply({
        embeds: [createErrorEmbed('Hata', 'Döngü modu ayarlanamadı.')],
        ephemeral: true,
      });
    }
  },
};
