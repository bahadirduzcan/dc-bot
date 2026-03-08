const { SlashCommandBuilder } = require('discord.js');
const { createErrorEmbed } = require('../../utils/embed');
const Genius = require('genius-lyrics');
const Client = new Genius.Client();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lyrics')
    .setDescription('Şu an çalan şarkının sözlerini göster'),

  async execute(interaction) {
    const distube = interaction.client.distube;
    const queue = distube.getQueue(interaction.guildId);

    if (!queue?.songs[0]) {
      return interaction.reply({
        embeds: [createErrorEmbed('Çalmıyor', 'Şu an çalan bir şarkı yok!')],
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    const song = queue.songs[0];
    const searchQuery = song.name.replace(/\(.*?\)|\[.*?\]/g, '').trim();

    try {
      const searches = await Client.songs.search(searchQuery);
      if (!searches.length) {
        return interaction.editReply({
          embeds: [createErrorEmbed('Bulunamadı', `**${song.name}** için şarkı sözü bulunamadı.`)],
        });
      }

      const lyrics = await searches[0].lyrics();
      const chunks = lyrics.match(/[\s\S]{1,3900}/g) || [];

      await interaction.editReply({
        embeds: [{
          color: 0x5865F2,
          title: `🎵 ${searches[0].title}`,
          description: chunks[0],
          footer: { text: searches[0].artist?.name || '' },
        }],
      });

      for (let i = 1; i < Math.min(chunks.length, 3); i++) {
        await interaction.followUp({ embeds: [{ color: 0x5865F2, description: chunks[i] }] });
      }
    } catch {
      await interaction.editReply({
        embeds: [createErrorEmbed('Hata', 'Şarkı sözleri alınamadı. Şarkı bulunamıyor olabilir.')],
      });
    }
  },
};
