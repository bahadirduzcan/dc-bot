const { SlashCommandBuilder } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removedupes')
    .setDescription('Kuyruktaki tekrar eden şarkıları sil'),

  async execute(interaction) {
    const queue = interaction.client.distube.getQueue(interaction.guildId);

    if (!queue || queue.songs.length <= 1) {
      return interaction.reply({ embeds: [createErrorEmbed('Kuyruk Boş', 'Kuyrukta yeterli şarkı yok.')], ephemeral: true });
    }

    const seen = new Set([queue.songs[0].url]);
    let removed = 0;
    let i = 1;
    while (i < queue.songs.length) {
      if (seen.has(queue.songs[i].url)) {
        queue.songs.splice(i, 1);
        removed++;
      } else {
        seen.add(queue.songs[i].url);
        i++;
      }
    }
    const before = queue.songs.length + removed;


    if (removed === 0) {
      return interaction.reply({ embeds: [createSuccessEmbed('✅ Temiz', 'Kuyrukta tekrar eden şarkı bulunamadı.')], ephemeral: true });
    }

    await interaction.reply({
      embeds: [createSuccessEmbed('🗑️ Tekrarlar Silindi', `${removed} tekrar eden şarkı kaldırıldı.`)],
    });
  },
};
