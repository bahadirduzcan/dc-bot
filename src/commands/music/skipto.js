const { SlashCommandBuilder } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skipto')
    .setDescription('Kuyruktaki belirli bir şarkıya atla')
    .addIntegerOption(o => o.setName('sira').setDescription('Şarkı sırası').setRequired(true).setMinValue(2)),

  async execute(interaction) {
    const queue = interaction.client.distube.getQueue(interaction.guildId);
    const pos = interaction.options.getInteger('sira') - 1;

    if (!queue) {
      return interaction.reply({ embeds: [createErrorEmbed('Kuyruk Yok', 'Şu an çalan bir şarkı yok!')], ephemeral: true });
    }

    if (pos >= queue.songs.length) {
      return interaction.reply({ embeds: [createErrorEmbed('Geçersiz Sıra', `Kuyrukta ${queue.songs.length} şarkı var.`)], ephemeral: true });
    }

    const song = queue.songs[pos];
    queue.songs.splice(1, pos - 1);
    await queue.skip();

    await interaction.reply({
      embeds: [createSuccessEmbed('⏭️ Atlandı', `**${song.name}** şarkısına geçildi.`)],
    });
  },
};
