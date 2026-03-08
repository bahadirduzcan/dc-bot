const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { createErrorEmbed } = require('../../utils/embed');

const activeVotes = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skiprequest')
    .setDescription('Şarkıyı atlamak için oy başlat'),

  activeVotes,

  async execute(interaction) {
    const queue = interaction.client.distube.getQueue(interaction.guildId);

    if (!queue?.songs[0]) {
      return interaction.reply({ embeds: [createErrorEmbed('Çalmıyor', 'Şu an çalan bir şarkı yok!')], ephemeral: true });
    }

    if (!interaction.member.voice.channel) {
      return interaction.reply({ embeds: [createErrorEmbed('Ses Kanalı Gerekli', 'Ses kanalında olmalısın!')], ephemeral: true });
    }

    if (activeVotes.has(interaction.guildId)) {
      return interaction.reply({ embeds: [createErrorEmbed('Aktif Oylama', 'Zaten devam eden bir oylama var!')], ephemeral: true });
    }

    const song = queue.songs[0];
    const voters = new Set([interaction.user.id]);
    const voiceMembers = interaction.member.voice.channel.members.filter(m => !m.user.bot);
    const needed = Math.ceil(voiceMembers.size * 0.51);

    activeVotes.set(interaction.guildId, voters);

    const embed = () => new EmbedBuilder()
      .setColor(0xFEE75C)
      .setTitle('🗳️ Skip Oylaması')
      .setDescription(`**${song.name}**\nAtlamak için oy ver!`)
      .addFields({ name: 'Oylar', value: `${voters.size} / ${needed} gerekli`, inline: true })
      .setFooter({ text: '60 saniye içinde geçerli' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('skipvote').setLabel('⏭️ Atla').setStyle(ButtonStyle.Primary)
    );

    const msg = await interaction.reply({ embeds: [embed()], components: [row], fetchReply: true });

    const timeout = setTimeout(async () => {
      activeVotes.delete(interaction.guildId);
      await msg.edit({ embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('🗳️ Oylama Sona Erdi').setDescription('Yeterli oy toplanamadı.')], components: [] }).catch(() => {});
    }, 60000);

    const collector = msg.createMessageComponentCollector({ time: 60000 });

    collector.on('collect', async (btn) => {
      if (btn.customId !== 'skipvote') return;
      const botChannelId = queue.voice?.channelId ?? queue.voice?.channel?.id;
      if (!btn.member.voice.channelId || btn.member.voice.channelId !== botChannelId) {
        return btn.reply({ content: 'Ses kanalında olmalısın!', ephemeral: true });
      }
      if (voters.has(btn.user.id)) {
        return btn.reply({ content: 'Zaten oy kullandın!', ephemeral: true });
      }

      voters.add(btn.user.id);
      await btn.update({ embeds: [embed()], components: [row] });

      if (voters.size >= needed) {
        clearTimeout(timeout);
        activeVotes.delete(interaction.guildId);
        collector.stop();
        await queue.skip().catch(() => {});
        await msg.edit({ embeds: [new EmbedBuilder().setColor(0x57F287).setTitle('✅ Şarkı Atlandı').setDescription(`**${song.name}** oy çokluğuyla atlandı.`)], components: [] }).catch(() => {});
      }
    });

    collector.on('end', () => {
      activeVotes.delete(interaction.guildId);
    });
  },
};
