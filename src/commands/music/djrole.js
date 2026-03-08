const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embed');
const { setDJRole, removeDJRole, getDJRole } = require('../../utils/settingsStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('djrole')
    .setDescription('DJ rolünü ayarla (sadece sunucu yöneticileri)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub => sub.setName('set').setDescription('DJ rolünü ayarla').addRoleOption(o => o.setName('rol').setDescription('DJ rolü').setRequired(true)))
    .addSubcommand(sub => sub.setName('remove').setDescription('DJ rolünü kaldır'))
    .addSubcommand(sub => sub.setName('status').setDescription('Mevcut DJ rolünü göster')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'set') {
      const role = interaction.options.getRole('rol');
      setDJRole(interaction.guildId, role.id);
      await interaction.reply({ embeds: [createSuccessEmbed('🎧 DJ Rolü Ayarlandı', `${role} artık DJ rolü. Sadece bu roldekiler müzik komutlarını kullanabilir.`)] });

    } else if (sub === 'remove') {
      removeDJRole(interaction.guildId);
      await interaction.reply({ embeds: [createSuccessEmbed('🎧 DJ Rolü Kaldırıldı', 'Artık herkes müzik komutlarını kullanabilir.')] });

    } else if (sub === 'status') {
      const roleId = getDJRole(interaction.guildId);
      if (!roleId) {
        await interaction.reply({ embeds: [createSuccessEmbed('🎧 DJ Rolü', 'DJ rolü ayarlı değil. Herkes kullanabilir.')], ephemeral: true });
      } else {
        await interaction.reply({ embeds: [createSuccessEmbed('🎧 DJ Rolü', `Mevcut DJ rolü: <@&${roleId}>`)], ephemeral: true });
      }
    }
  },
};
