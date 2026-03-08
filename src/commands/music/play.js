const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createErrorEmbed } = require('../../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Şarkı veya playlist çal (YouTube, Spotify, SoundCloud)')
    .addStringOption(option =>
      option
        .setName('sorgu')
        .setDescription('Şarkı adı veya link')
        .setRequired(true)
    ),

  async execute(interaction) {
    const query = interaction.options.getString('sorgu');
    const member = interaction.member;
    const voiceChannel = member.voice.channel;
    const distube = interaction.client.distube;

    if (!voiceChannel) {
      return interaction.reply({
        embeds: [createErrorEmbed('Ses Kanalı Gerekli', 'Önce bir ses kanalına katılmalısın!')],
        ephemeral: true,
      });
    }

    const { PermissionFlagsBits } = require('discord.js');
    const permissions = voiceChannel.permissionsFor(interaction.client.user);
    if (!permissions.has(PermissionFlagsBits.Connect) || !permissions.has(PermissionFlagsBits.Speak)) {
      return interaction.reply({
        embeds: [createErrorEmbed('Yetki Hatası', 'Bu ses kanalına bağlanma iznim yok!')],
        ephemeral: true,
      });
    }

    // YouTube Mix/Radio playlist linklerini normalize et
    let cleanQuery = query;
    try {
      const url = new URL(query);
      const list = url.searchParams.get('list');
      const v = url.searchParams.get('v');
      if (list) {
        if (list.startsWith('RD') && v && list === `RD${v}`) {
          // Sonsuz autoplay radio (list=RD+videoId) → sadece videoyu çal
          url.searchParams.delete('list');
          url.searchParams.delete('start_radio');
          cleanQuery = url.toString();
        } else if (list.startsWith('RD') || list.startsWith('FL')) {
          // Mix/algoritmik playlist → playlist URL formatına çevir
          cleanQuery = `https://www.youtube.com/playlist?list=${list}`;
        } else {
          url.searchParams.delete('start_radio');
          cleanQuery = url.toString();
        }
      }
    } catch {}

    await interaction.deferReply();

    // Hata olursa "düşünüyor" kalmasın diye güvenlik timeout'u
    const safetyTimeout = setTimeout(() => {
      interaction.deleteReply().catch(() => {});
    }, 30000);

    try {
      await distube.play(voiceChannel, cleanQuery, {
        member,
        textChannel: interaction.channel,
        interaction,
      });
      clearTimeout(safetyTimeout);
      await interaction.deleteReply().catch(() => {});
    } catch (error) {
      clearTimeout(safetyTimeout);
      console.error('[Play Komutu]', error);

      let errorMsg = 'Şarkı çalınamadı. Lütfen tekrar dene.';
      if (error.message?.includes('private')) errorMsg = 'Bu video gizli veya erişilemiyor.';
      else if (error.message?.includes('unavailable')) errorMsg = 'Bu video mevcut değil.';
      else if (error.message?.includes('age')) errorMsg = 'Bu içerik yaş kısıtlamalı.';
      else if (error.message?.includes('region')) errorMsg = 'Bu içerik bölgeni desteklemiyor.';
      else if (error.message?.includes('JSON') || error.message?.includes('Deprecated')) errorMsg = 'Video bilgisi alınamadı. Farklı bir link veya isim dene.';

      await interaction.editReply({
        embeds: [createErrorEmbed('Oynatma Hatası', errorMsg)],
      }).catch(() => {});
    }
  },
};
