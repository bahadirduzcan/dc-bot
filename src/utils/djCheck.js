const { getDJRole } = require('./settingsStore');
const { createErrorEmbed } = require('./embed');

const DJ_COMMANDS = new Set([
  'play', 'pause', 'resume', 'skip', 'stop', 'volume', 'loop',
  'shuffle', 'seek', 'remove', 'move', 'playnext', 'replay',
  '247', 'save', 'autoplay', 'skiprequest',
  'playskip', 'clearqueue', 'removedupes', 'skipto', 'poll',
]);

async function checkDJ(interaction) {
  const djRoleId = getDJRole(interaction.guildId);
  if (!djRoleId) return true;
  if (interaction.member.permissions.has('ManageGuild')) return true;
  if (interaction.member.roles.cache.has(djRoleId)) return true;

  await interaction.reply({
    embeds: [createErrorEmbed('DJ Rolü Gerekli', `Bu komutu kullanmak için <@&${djRoleId}> rolüne ihtiyacın var!`)],
    ephemeral: true,
  });
  return false;
}

module.exports = { checkDJ, DJ_COMMANDS };
