const { Events, ActivityType } = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`\n✅ Bot hazır! ${client.user.tag} olarak giriş yapıldı.`);
    console.log(`📊 ${client.guilds.cache.size} sunucuda aktif.`);
    console.log(`👥 ${client.users.cache.size} kullanıcıya erişim var.\n`);

    // Bot durumunu ayarla - döngülü
    const activities = [
      { name: '/play ile müzik çal', type: ActivityType.Listening },
      { name: '/help için yardım', type: ActivityType.Playing },
      { name: `${client.guilds.cache.size} sunucu`, type: ActivityType.Watching },
    ];

    let i = 0;
    setInterval(() => {
      client.user.setActivity(activities[i % activities.length]);
      i++;
    }, 15000);

    client.user.setActivity(activities[0]);
  },
};
