const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createErrorEmbed } = require('../../utils/embed');
const { getHistory } = require('../../utils/historyStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('history')
    .setDescription('Son çalınan şarkıları göster'),

  async execute(interaction) {
    const history = getHistory(interaction.guildId);

    if (!history.length) {
      return interaction.reply({ embeds: [createErrorEmbed('Geçmiş Yok', 'Henüz hiç şarkı çalınmadı.')], ephemeral: true });
    }

    const list = history
      .slice(0, 15)
      .map((s, i) => `**${i + 1}.** [${s.name}](${s.url}) \`${s.duration}\``)
      .join('\n');

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle('📜 Çalınan Şarkılar')
          .setDescription(list)
          .setFooter({ text: `Son ${history.length} şarkı` })
          .setTimestamp(),
      ],
    });
  },
};
