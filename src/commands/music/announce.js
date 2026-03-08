const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embed');
const { setAnnounceChannel, removeAnnounceChannel, getAnnounceChannel } = require('../../utils/settingsStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Şarkı değişince bildirim gönderilecek kanalı ayarla')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub => sub.setName('set').setDescription('Bildirim kanalını ayarla')
      .addChannelOption(o => o.setName('kanal').setDescription('Metin kanalı').addChannelTypes(ChannelType.GuildText).setRequired(true)))
    .addSubcommand(sub => sub.setName('remove').setDescription('Bildirim kanalını kaldır'))
    .addSubcommand(sub => sub.setName('status').setDescription('Mevcut bildirim kanalını göster')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'set') {
      const channel = interaction.options.getChannel('kanal');
      setAnnounceChannel(interaction.guildId, channel.id);
      await interaction.reply({ embeds: [createSuccessEmbed('📢 Bildirim Kanalı Ayarlandı', `Şarkı değişince ${channel} kanalına bildirim gönderilecek.`)] });

    } else if (sub === 'remove') {
      removeAnnounceChannel(interaction.guildId);
      await interaction.reply({ embeds: [createSuccessEmbed('📢 Bildirim Kaldırıldı', 'Artık bildirim gönderilmeyecek.')] });

    } else if (sub === 'status') {
      const channelId = getAnnounceChannel(interaction.guildId);
      if (!channelId) {
        await interaction.reply({ embeds: [createErrorEmbed('Bildirim Yok', 'Bildirim kanalı ayarlı değil.')], ephemeral: true });
      } else {
        await interaction.reply({ embeds: [createSuccessEmbed('📢 Bildirim Kanalı', `Mevcut kanal: <#${channelId}>`)], ephemeral: true });
      }
    }
  },
};
