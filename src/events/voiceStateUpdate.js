const { Events } = require('discord.js');
const { is247Mode } = require('../utils/settingsStore');

module.exports = {
  name: Events.VoiceStateUpdate,
  once: false,
  execute(oldState, newState, client) {
    const queue = client.distube?.getQueue(oldState.guild.id);
    if (!queue) return;

    // Bot sesin kanalında mı kontrol et
    const botVoiceChannel = oldState.guild.members.me?.voice.channel;
    if (!botVoiceChannel) return;

    // 247 modda hiç ayrılma
    if (is247Mode(oldState.guild.id)) return;

    // Kanalda sadece bot kaldıysa 5 dakika sonra sessizce ayrıl
    const members = botVoiceChannel.members.filter(m => !m.user.bot);

    const funnyMessages = [
      'Yalnızlara mı çalacağım şarkıyı? Hayır teşekkürler, ben de kendime saygım var.',
      'Odada kimse yoktu, ben de mikrofonumu alıp gittim. Görüşürüz.',
      'Boş odaya 5 dakika çaldım. Konser iptal, biletler iade.',
      'Kendi kendime konser verdim ama kimse izlemedi. Bu acı.',
      'Sessizliğe şarkı çalmak kulağıma iyi gelmedi, çıkıyorum.',
    ];

    if (members.size === 0) {
      if (client._leaveTimeout) clearTimeout(client._leaveTimeout);

      client._leaveTimeout = setTimeout(async () => {
        const currentQueue = client.distube?.getQueue(oldState.guild.id);
        if (currentQueue) {
          const botChannel = oldState.guild.members.me?.voice.channel;
          const stillEmpty = !botChannel || botChannel.members.filter(m => !m.user.bot).size === 0;
          if (stillEmpty) {
            const channel = currentQueue.textChannel;
            const msg = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
            await currentQueue.stop().catch(() => {});
            channel?.send({ embeds: [{ color: 0xED4245, title: '👋 Gidiyorum', description: msg }] });
          }
        }
      }, 5 * 60 * 1000);
    } else {
      // Biri geri döndüyse timeout'u iptal et
      if (client._leaveTimeout) {
        clearTimeout(client._leaveTimeout);
        client._leaveTimeout = null;
      }
    }
  },
};
