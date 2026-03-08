const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embed');
const { addToBlacklist, removeFromBlacklist, getBlacklist } = require('../../utils/settingsStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blacklist')
    .setDescription('Müzik komutlarını kullanmasını engelle')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub => sub.setName('add').setDescription('Kullanıcıyı engelle')
      .addUserOption(o => o.setName('kullanici').setDescription('Engellenecek kullanıcı').setRequired(true)))
    .addSubcommand(sub => sub.setName('remove').setDescription('Engeli kaldır')
      .addUserOption(o => o.setName('kullanici').setDescription('Engeli kalkacak kullanıcı').setRequired(true)))
    .addSubcommand(sub => sub.setName('list').setDescription('Engellenen kullanıcıları listele')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
      const user = interaction.options.getUser('kullanici');
      if (user.id === interaction.user.id) return interaction.reply({ embeds: [createErrorEmbed('Hata', 'Kendini engelleyemezsin!')], ephemeral: true });
      const added = addToBlacklist(interaction.guildId, user.id);
      if (!added) return interaction.reply({ embeds: [createErrorEmbed('Zaten Engelli', `${user} zaten engellendi.`)], ephemeral: true });
      await interaction.reply({ embeds: [createSuccessEmbed('🚫 Engellendi', `${user} artık müzik komutlarını kullanamaz.`)] });

    } else if (sub === 'remove') {
      const user = interaction.options.getUser('kullanici');
      const removed = removeFromBlacklist(interaction.guildId, user.id);
      if (!removed) return interaction.reply({ embeds: [createErrorEmbed('Listede Yok', `${user} engelli değil.`)], ephemeral: true });
      await interaction.reply({ embeds: [createSuccessEmbed('✅ Engel Kaldırıldı', `${user} artık müzik komutlarını kullanabilir.`)] });

    } else if (sub === 'list') {
      const list = getBlacklist(interaction.guildId);
      if (!list.length) return interaction.reply({ embeds: [createSuccessEmbed('🚫 Blacklist', 'Engellenen kullanıcı yok.')], ephemeral: true });
      const desc = list.map((id, i) => `**${i + 1}.** <@${id}>`).join('\n');
      await interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('🚫 Engellenen Kullanıcılar').setDescription(desc)], ephemeral: true });
    }
  },
};
