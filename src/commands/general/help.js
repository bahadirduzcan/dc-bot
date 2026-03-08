const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Tüm komutları listele'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🤖 Bot Komutları')
      .setDescription('All-in-One Discord Bot - Müzik Modülü')
      .addFields(
        {
          name: '🎵 Müzik Komutları',
          value: [
            '`/play <sorgu>` - Şarkı veya playlist çal',
            '`/skip` - Sonraki şarkıya geç',
            '`/stop` - Müziği durdur',
            '`/pause` - Duraklat',
            '`/resume` - Devam ettir',
            '`/queue` - Kuyruğu göster',
            '`/nowplaying` - Çalan şarkı',
            '`/volume <1-100>` - Ses seviyesi',
            '`/shuffle` - Kuyruğu karıştır',
            '`/loop <mod>` - Döngü modu',
            '`/seek <saniye>` - Konuma git',
            '`/remove <sıra>` - Kuyruktan kaldır',
            '`/autoplay` - Otomatik şarkı',
          ].join('\n'),
          inline: false,
        },
        {
          name: '⚙️ Genel Komutlar',
          value: [
            '`/help` - Bu mesajı göster',
            '`/ping` - Bot gecikmesi',
          ].join('\n'),
          inline: false,
        }
      )
      .addFields({
        name: '🎧 Desteklenen Kaynaklar',
        value: 'YouTube • Spotify • SoundCloud • ve daha fazlası',
        inline: false,
      })
      .setFooter({ text: 'All-in-One Discord Bot • Müzik Modülü' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
