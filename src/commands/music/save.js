const { SlashCommandBuilder } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embed');
const { savePlaylist } = require('../../utils/playlistStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('save')
    .setDescription('Şu anki kuyruğu playlist olarak kaydet')
    .addStringOption(o => o.setName('isim').setDescription('Playlist adı').setRequired(true)),

  async execute(interaction) {
    const queue = interaction.client.distube.getQueue(interaction.guildId);
    const name = interaction.options.getString('isim');

    if (!queue?.songs.length) {
      return interaction.reply({ embeds: [createErrorEmbed('Kuyruk Boş', 'Kaydedilecek şarkı yok!')], ephemeral: true });
    }

    savePlaylist(interaction.guildId, interaction.user.id, name, queue.songs);

    await interaction.reply({
      embeds: [createSuccessEmbed('💾 Playlist Kaydedildi', `**${name}** adıyla ${queue.songs.length} şarkı kaydedildi.`)],
    });
  },
};
