const { SlashCommandBuilder } = require('discord.js');
const { createErrorEmbed } = require('../../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('playskip')
    .setDescription('Şarkıyı çal ve mevcut şarkıyı atla')
    .addStringOption(o => o.setName('sorgu').setDescription('Şarkı adı veya link').setRequired(true)),

  async execute(interaction) {
    const query = interaction.options.getString('sorgu');
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply({ embeds: [createErrorEmbed('Ses Kanalı Gerekli', 'Önce bir ses kanalına katılmalısın!')], ephemeral: true });
    }

    let cleanQuery = query;
    try {
      const url = new URL(query);
      const list = url.searchParams.get('list');
      if (list && (list.startsWith('RD') || list.startsWith('FL'))) {
        url.searchParams.delete('list');
        url.searchParams.delete('start_radio');
        cleanQuery = url.toString();
      }
    } catch {}

    await interaction.deferReply();

    try {
      await interaction.client.distube.play(voiceChannel, cleanQuery, {
        member: interaction.member,
        textChannel: interaction.channel,
        skip: true,
      });
      await interaction.deleteReply().catch(() => {});
    } catch (error) {
      console.error('[PlaySkip]', error);
      await interaction.editReply({ embeds: [createErrorEmbed('Hata', 'Şarkı çalınamadı.')] });
    }
  },
};
