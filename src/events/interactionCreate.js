const { Events, EmbedBuilder } = require('discord.js');
const { checkDJ, DJ_COMMANDS } = require('../utils/djCheck');
const { isBlacklisted } = require('../utils/settingsStore');

// Bu komutların yanıtları silinmez (kullanıcının okuyması gerekiyor)
const KEEP_REPLY = new Set([
  'play', 'search', 'queue', 'poll', 'skiprequest',
  'favorites', 'history', 'lyrics', 'settings', 'help', 'ping', 'save',
]);

function scheduleDelete(interaction, delay = 10000) {
  setTimeout(() => {
    interaction.fetchReply().then(msg => msg.delete()).catch(() => {});
  }, delay);
}

module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
      console.warn(`[Uyarı] '${interaction.commandName}' komutu bulunamadı.`);
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xED4245)
            .setTitle('❌ Komut Bulunamadı')
            .setDescription('Bu komut mevcut değil veya güncel değil. `/help` ile komutları gör.')
        ],
        ephemeral: true,
      });
    }

    if (isBlacklisted(interaction.guildId, interaction.user.id)) {
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('🚫 Engellendi').setDescription('Müzik komutlarını kullanma yetkin yok.')], ephemeral: true });
    }

    if (DJ_COMMANDS.has(interaction.commandName)) {
      const allowed = await checkDJ(interaction);
      if (!allowed) return;
    }

    try {
      await command.execute(interaction);
      if (!KEEP_REPLY.has(interaction.commandName)) {
        scheduleDelete(interaction);
      }
    } catch (error) {
      console.error(`[Komut Hatası] ${interaction.commandName}:`, error);

      const errorEmbed = new EmbedBuilder()
        .setColor(0xED4245)
        .setTitle('❌ Bir Hata Oluştu')
        .setDescription('Komut çalıştırılırken bir hata oluştu. Lütfen tekrar dene.')
        .setTimestamp();

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [errorEmbed] }).catch(console.error);
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true }).catch(console.error);
      }
    }
  },
};
