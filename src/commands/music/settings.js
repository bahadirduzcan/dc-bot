const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getDJRole, is247Mode, getAnnounceChannel, getBlacklist } = require('../../utils/settingsStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('settings')
    .setDescription('Sunucu müzik ayarlarını göster')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const guildId = interaction.guildId;
    const djRoleId = getDJRole(guildId);
    const mode247 = is247Mode(guildId);
    const announceId = getAnnounceChannel(guildId);
    const blacklist = getBlacklist(guildId);

    const { getVolume } = require('../../utils/volumeStore');
    const volume = getVolume(guildId);

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle('⚙️ Müzik Ayarları')
          .addFields(
            { name: '🎧 DJ Rolü', value: djRoleId ? `<@&${djRoleId}>` : 'Ayarlı değil (herkes kullanabilir)', inline: true },
            { name: '🕐 7/24 Mod', value: mode247 ? '✅ Açık' : '❌ Kapalı', inline: true },
            { name: '📢 Bildirim Kanalı', value: announceId ? `<#${announceId}>` : 'Ayarlı değil', inline: true },
            { name: '🔊 Varsayılan Ses', value: `%${volume}`, inline: true },
            { name: '🚫 Engellenen Kullanıcı', value: `${blacklist.length} kişi`, inline: true },
          )
          .setTimestamp(),
      ],
      ephemeral: true,
    });
  },
};
