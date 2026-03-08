const { SlashCommandBuilder } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('move')
    .setDescription('Kuyruktaki şarkının sırasını değiştir')
    .addIntegerOption(o => o.setName('kimden').setDescription('Şarkının mevcut sırası').setRequired(true).setMinValue(2))
    .addIntegerOption(o => o.setName('nereye').setDescription('Yeni sırası').setRequired(true).setMinValue(2)),

  async execute(interaction) {
    const distube = interaction.client.distube;
    const queue = distube.getQueue(interaction.guildId);
    const from = interaction.options.getInteger('kimden') - 1;
    const to = interaction.options.getInteger('nereye') - 1;

    if (!queue) {
      return interaction.reply({ embeds: [createErrorEmbed('Kuyruk Yok', 'Şu an çalan bir şarkı yok!')], ephemeral: true });
    }

    if (from >= queue.songs.length || to >= queue.songs.length) {
      return interaction.reply({ embeds: [createErrorEmbed('Geçersiz Sıra', `Kuyrukta ${queue.songs.length} şarkı var.`)], ephemeral: true });
    }

    const [song] = queue.songs.splice(from, 1);
    queue.songs.splice(to, 0, song);

    await interaction.reply({
      embeds: [createSuccessEmbed('✅ Taşındı', `**${song.name}** → ${to + 1}. sıraya taşındı.`)],
    });
  },
};
