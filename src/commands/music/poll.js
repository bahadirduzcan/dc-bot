const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { createErrorEmbed } = require('../../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Sıradaki şarkı için oylama başlat')
    .addStringOption(o => o.setName('sarki1').setDescription('1. seçenek').setRequired(true))
    .addStringOption(o => o.setName('sarki2').setDescription('2. seçenek').setRequired(true))
    .addStringOption(o => o.setName('sarki3').setDescription('3. seçenek (isteğe bağlı)')),

  async execute(interaction) {
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({ embeds: [createErrorEmbed('Ses Kanalı Gerekli', 'Ses kanalında olmalısın!')], ephemeral: true });
    }

    const options = [
      interaction.options.getString('sarki1'),
      interaction.options.getString('sarki2'),
      interaction.options.getString('sarki3'),
    ].filter(Boolean);

    const votes = new Array(options.length).fill(0);
    const voted = new Set();

    const makeEmbed = () => new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🗳️ Sıradaki Şarkı Oylaması')
      .setDescription(options.map((o, i) => `**${i + 1}.** ${o}\n${'█'.repeat(votes[i])}${'░'.repeat(10 - Math.min(votes[i], 10))} ${votes[i]} oy`).join('\n\n'))
      .setFooter({ text: '30 saniye içinde oy kullan' });

    const row = new ActionRowBuilder().addComponents(
      options.map((_, i) =>
        new ButtonBuilder().setCustomId(`poll_${i}`).setLabel(`${i + 1}. Seçenek`).setStyle(ButtonStyle.Primary)
      )
    );

    const msg = await interaction.reply({ embeds: [makeEmbed()], components: [row], fetchReply: true });

    const collector = msg.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async (btn) => {
      if (voted.has(btn.user.id)) return btn.reply({ content: 'Zaten oy kullandın!', ephemeral: true });
      const idx = parseInt(btn.customId.split('_')[1]);
      votes[idx]++;
      voted.add(btn.user.id);
      await btn.update({ embeds: [makeEmbed()], components: [row] });
    });

    collector.on('end', async () => {
      const winner = votes.indexOf(Math.max(...votes));
      await msg.edit({ embeds: [makeEmbed().setFooter({ text: `Oylama bitti! Kazanan: ${options[winner]}` })], components: [] });

      if (voted.size > 0) {
        await interaction.client.distube.play(voiceChannel, options[winner], {
          member: interaction.member,
          textChannel: interaction.channel,
        }).catch(() => {});
      }
    });
  },
};
