const { Events } = require('discord.js');
const { is247Mode } = require('../utils/settingsStore');

// Per-guild leave timeout map (client üzerinde saklanır)
function getLeaveTimeouts(client) {
  if (!client._leaveTimeouts) client._leaveTimeouts = new Map();
  return client._leaveTimeouts;
}

module.exports = {
  name: Events.VoiceStateUpdate,
  once: false,
  execute(oldState, newState, client) {
    const guildId = oldState.guild.id;
    const queue = client.distube?.getQueue(guildId);
    if (!queue) return;

    // Bot sesin kanalında mı kontrol et
    const botVoiceChannel = oldState.guild.members.me?.voice.channel;
    if (!botVoiceChannel) return;

    // 247 modda hiç ayrılma
    if (is247Mode(guildId)) return;

    // Kanalda sadece bot kaldıysa 5 dakika sonra sessizce ayrıl
    const members = botVoiceChannel.members.filter(m => !m.user.bot);
    const leaveTimeouts = getLeaveTimeouts(client);

    const funnyMessages = [
      'Yalnızlara mı çalacağım şarkıyı? Hayır teşekkürler, ben de kendime saygım var.',
      'Odada kimse yoktu, ben de mikrofonumu alıp gittim. Görüşürüz.',
      'Boş odaya 5 dakika çaldım. Konser iptal, biletler iade.',
      'Kendi kendime konser verdim ama kimse izlemedi. Bu acı.',
      'Sessizliğe şarkı çalmak kulağıma iyi gelmedi, çıkıyorum.',
    ];

    if (members.size === 0) {
      if (leaveTimeouts.has(guildId)) clearTimeout(leaveTimeouts.get(guildId));

      const timeout = setTimeout(async () => {
        leaveTimeouts.delete(guildId);
        const currentQueue = client.distube?.getQueue(guildId);
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

      leaveTimeouts.set(guildId, timeout);
    } else {
      // Biri geri döndüyse timeout'u iptal et
      if (leaveTimeouts.has(guildId)) {
        clearTimeout(leaveTimeouts.get(guildId));
        leaveTimeouts.delete(guildId);
      }
    }
  },
};
