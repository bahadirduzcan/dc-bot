const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const { createErrorEmbed } = require('../../utils/embed');
const { spawn } = require('child_process');
const path = require('path');

const YTDLP = path.join(
  path.dirname(require.resolve('@distube/yt-dlp')),
  '..', 'bin',
  `yt-dlp${process.platform === 'win32' ? '.exe' : ''}`
);

function searchYoutube(query, limit = 5) {
  return new Promise((resolve) => {
    const proc = spawn(YTDLP, [
      `ytsearch${limit}:${query}`,
      '--dump-json', '--no-playlist', '--no-warnings', '-q',
    ]);
    let output = '';
    proc.stdout.on('data', d => output += d);
    proc.on('close', () => {
      const results = output.trim().split('\n')
        .map(line => { try { return JSON.parse(line.trim()); } catch { return null; } })
        .filter(Boolean);
      resolve(results);
    });
    proc.on('error', () => resolve([]));
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription('YouTube\'da şarkı ara ve seç')
    .addStringOption(o => o.setName('sorgu').setDescription('Arama terimi').setRequired(true)),

  async execute(interaction) {
    const query = interaction.options.getString('sorgu');
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply({ embeds: [createErrorEmbed('Ses Kanalı Gerekli', 'Önce bir ses kanalına katılmalısın!')], ephemeral: true });
    }

    await interaction.deferReply();

    try {
      const results = await searchYoutube(query, 5);

      if (!results.length) {
        return interaction.editReply({ embeds: [createErrorEmbed('Bulunamadı', 'Sonuç bulunamadı.')] });
      }

      const list = results.map((r, i) =>
        `**${i + 1}.** [${r.title}](${r.webpage_url}) \`${r.duration_string || '?'}\``
      ).join('\n');

      const menu = new StringSelectMenuBuilder()
        .setCustomId(`search_${interaction.id}`)
        .setPlaceholder('Bir şarkı seç...')
        .addOptions(results.map((r, i) => ({
          label: r.title.slice(0, 100),
          description: `${r.duration_string || '?'} • ${(r.uploader || '').slice(0, 50)}`.slice(0, 100),
          value: r.webpage_url,
        })));

      const row = new ActionRowBuilder().addComponents(menu);

      const msg = await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle(`🔍 "${query}" Sonuçları`).setDescription(list)],
        components: [row],
      });

      const collector = msg.createMessageComponentCollector({ time: 30000 });

      collector.on('collect', async (sel) => {
        if (sel.user.id !== interaction.user.id) {
          return sel.reply({ content: 'Bu arama sana ait!', ephemeral: true });
        }
        collector.stop();
        await sel.deferUpdate();
        await interaction.client.distube.play(voiceChannel, sel.values[0], {
          member: interaction.member,
          textChannel: interaction.channel,
        });
        await msg.edit({ components: [] }).catch(() => {});
      });

      collector.on('end', (_, reason) => {
        if (reason === 'time') msg.edit({ components: [] }).catch(() => {});
      });

    } catch (error) {
      console.error('[Search]', error);
      await interaction.editReply({ embeds: [createErrorEmbed('Hata', 'Arama yapılamadı.')] });
    }
  },
};
