const { SlashCommandBuilder } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Mevcut şarkıyı atla'),

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

    const currentSong = queue.songs[0];

    try {
      await queue.skip();
      await interaction.reply({
        embeds: [createSuccessEmbed('⏭️ Atlandı', `**${currentSong.name}** atlandı.`)],
      });
    } catch (error) {
      await interaction.reply({
        embeds: [createErrorEmbed('Hata', 'Şarkı atlanamadı.')],
        ephemeral: true,
      });
    }
  },
};
