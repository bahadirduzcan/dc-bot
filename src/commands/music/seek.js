const { SlashCommandBuilder } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('seek')
    .setDescription('Şarkıda belirli bir konuma git')
    .addIntegerOption(option =>
      option
        .setName('saniye')
        .setDescription('Gidilecek konum (saniye cinsinden)')
        .setRequired(true)
        .setMinValue(0)
    ),

  async execute(interaction) {
    const distube = interaction.client.distube;
    const queue = distube.getQueue(interaction.guildId);
    const seconds = interaction.options.getInteger('saniye');

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

    const currentSong = queue.songs[0];
    if (seconds > currentSong.duration) {
      return interaction.reply({
        embeds: [createErrorEmbed('Geçersiz Konum', `Şarkı süresi ${currentSong.formattedDuration}. Daha küçük bir değer gir.`)],
        ephemeral: true,
      });
    }

    try {
      await queue.seek(seconds);
      const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
      const secs = (seconds % 60).toString().padStart(2, '0');
      await interaction.reply({
        embeds: [createSuccessEmbed('⏩ Konuma Gidildi', `**${mins}:${secs}** konumuna gidildi.`)],
      });
    } catch (error) {
      await interaction.reply({
        embeds: [createErrorEmbed('Hata', 'Belirtilen konuma gidilemedi.')],
        ephemeral: true,
      });
    }
  },
};
