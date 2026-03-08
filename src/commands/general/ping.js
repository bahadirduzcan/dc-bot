const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Bot gecikmesini göster'),

  async execute(interaction) {
    const sent = await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle('🏓 Ping Ölçülüyor...')
      ],
      fetchReply: true,
    });

    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const wsLatency = interaction.client.ws.ping;

    const color = latency < 100 ? 0x57F287 : latency < 200 ? 0xFEE75C : 0xED4245;

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(color)
          .setTitle('🏓 Pong!')
          .addFields(
            { name: 'API Gecikmesi', value: `${latency}ms`, inline: true },
            { name: 'WebSocket Gecikmesi', value: `${wsLatency}ms`, inline: true },
          )
          .setTimestamp(),
      ],
    });
  },
};
