const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createNowPlayingEmbed, createErrorEmbed } = require('../utils/embed');
const { getVolume } = require('../utils/volumeStore');
const { addToHistory } = require('../utils/historyStore');
const { addFavorite } = require('../utils/favoriteStore');
const { getAnnounceChannel } = require('../utils/settingsStore');
const { setLive, clearLive } = require('../utils/liveNowPlaying');
const { buildQueueEmbed } = require('../commands/music/queue');

const nextSongTimers = new Map();
const lastNowPlayingMsg = new Map();
const lastAddSongMsgs = new Map();
const deleteTimers = new Map();

// Kontrol buton satırlarını oluştur
function createControlRows(queue) {
  const isPaused = queue.paused;
  const loopMode = queue.repeatMode ?? 0;
  const hasPrev = queue.previousSongs?.length > 0;
  const hasNext = queue.songs.length > 1;

  const loopLabels = ['Döngü: Kapalı', 'Döngü: Şarkı', 'Döngü: Kuyruk'];
  const loopStyles = [ButtonStyle.Secondary, ButtonStyle.Primary, ButtonStyle.Success];

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`ctrl_prev_${queue.id}`).setEmoji('⏮️')
      .setStyle(ButtonStyle.Secondary).setDisabled(!hasPrev),
    new ButtonBuilder()
      .setCustomId(`ctrl_pause_${queue.id}`)
      .setEmoji(isPaused ? '▶️' : '⏸️')
      .setLabel(isPaused ? 'Devam' : 'Duraklat')
      .setStyle(isPaused ? ButtonStyle.Success : ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`ctrl_stop_${queue.id}`).setEmoji('⏹️').setLabel('Durdur')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`ctrl_skip_${queue.id}`).setEmoji('⏭️').setLabel('Sonraki')
      .setStyle(ButtonStyle.Secondary).setDisabled(!hasNext),
    new ButtonBuilder()
      .setCustomId(`ctrl_replay_${queue.id}`).setEmoji('🔄').setLabel('Başa Sar')
      .setStyle(ButtonStyle.Secondary),
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`ctrl_loop_${queue.id}`).setEmoji('🔁')
      .setLabel(loopLabels[loopMode]).setStyle(loopStyles[loopMode]),
    new ButtonBuilder()
      .setCustomId(`ctrl_shuffle_${queue.id}`).setEmoji('🔀').setLabel('Karıştır')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`ctrl_queue_${queue.id}`).setEmoji('📋').setLabel('Kuyruk')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`like_${queue.id}`).setEmoji('👍').setLabel('Beğen')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`dislike_${queue.id}`).setEmoji('👎').setLabel('Beğenme')
      .setStyle(ButtonStyle.Danger),
  );

  return [row1, row2];
}

async function deleteOldMessage(guildId) {
  if (deleteTimers.has(guildId)) {
    clearTimeout(deleteTimers.get(guildId));
    deleteTimers.delete(guildId);
  }
  const old = lastNowPlayingMsg.get(guildId);
  if (old) {
    await old.delete().catch(() => {});
    lastNowPlayingMsg.delete(guildId);
  }
}

async function deleteOldAddSongMsgs(guildId) {
  const msgs = lastAddSongMsgs.get(guildId) || [];
  for (const m of msgs) await m.delete().catch(() => {});
  lastAddSongMsgs.set(guildId, []);
}

// Mevcut now playing mesajını güncelle (buton durumları değişince)
async function updateNowPlayingMsg(guildId, distube) {
  const msg = lastNowPlayingMsg.get(guildId);
  if (!msg) return;
  const queue = distube.getQueue(guildId);
  if (!queue?.songs[0]) return;
  await msg.edit({
    embeds: [createNowPlayingEmbed(queue.songs[0], queue)],
    components: createControlRows(queue),
  }).catch(() => {});
}

function setupMusicEvents(client) {
  const distube = client.distube;

  // Şarkı başladığında
  distube.on('playSong', async (queue, song) => {
    addToHistory(queue.id, song);
    clearLive(queue.id);

    await deleteOldMessage(queue.id);
    await deleteOldAddSongMsgs(queue.id);

    if (nextSongTimers.has(queue.id)) {
      clearTimeout(nextSongTimers.get(queue.id));
      nextSongTimers.delete(queue.id);
    }

    // Sıradaki şarkı önizlemesi
    if (queue.songs.length > 1 && song.duration > 30) {
      const delayMs = Math.max(1000, (song.duration - 15) * 1000);
      const timer = setTimeout(() => {
        const q = distube.getQueue(queue.id);
        if (!q || q.songs[0]?.url !== song.url || q.songs.length < 2) return;
        q.textChannel?.send({
          embeds: [{ color: 0xFEE75C, description: `⏭️ **Sıradaki:** [${q.songs[1].name}](${q.songs[1].url}) \`${q.songs[1].formattedDuration}\`` }],
        }).then(m => setTimeout(() => m?.delete().catch(() => {}), 20000)).catch(() => {});
      }, delayMs);
      nextSongTimers.set(queue.id, timer);
    }

    const msg = await queue.textChannel?.send({
      embeds: [createNowPlayingEmbed(song, queue)],
      components: createControlRows(queue),
    }).catch(() => null);

    if (msg) {
      lastNowPlayingMsg.set(queue.id, msg);

      // Canlı ilerleme çubuğu (her 5 saniyede güncelle)
      const songUrl = song.url;
      const intervalId = setInterval(async () => {
        const q = distube.getQueue(queue.id);
        if (!q?.songs[0] || q.songs[0].url !== songUrl) {
          clearLive(queue.id);
          return;
        }
        await msg.edit({
          embeds: [createNowPlayingEmbed(q.songs[0], q)],
          components: createControlRows(q),
        }).catch(() => clearLive(queue.id));
      }, 5000);
      setLive(queue.id, intervalId);
    }

    // Announce kanalı
    const announceId = getAnnounceChannel(queue.id);
    if (announceId && announceId !== queue.textChannel?.id) {
      client.channels.cache.get(announceId)
        ?.send({ embeds: [createNowPlayingEmbed(song, queue)] }).catch(() => {});
    }
  });

  // Şarkı eklendiğinde
  distube.on('addSong', async (queue, song) => {
    const msg = await queue.textChannel?.send({
      embeds: [
        new EmbedBuilder().setColor(0x5865F2).setTitle('📋 Kuyruğa Eklendi')
          .setDescription(`**[${song.name}](${song.url})**`)
          .addFields(
            { name: 'Süre', value: song.formattedDuration, inline: true },
            { name: 'Kuyruk Sırası', value: `#${queue.songs.length}`, inline: true },
            { name: 'İsteyen', value: song.user?.toString() || 'Bilinmiyor', inline: true }
          ).setThumbnail(song.thumbnail).setTimestamp(),
      ],
    }).catch(() => null);
    if (msg) {
      const msgs = lastAddSongMsgs.get(queue.id) || [];
      msgs.push(msg);
      lastAddSongMsgs.set(queue.id, msgs);
    }
  });

  // Playlist eklendiğinde
  const MAX_PLAYLIST = 100;
  distube.on('addList', async (queue, playlist) => {
    let trimmed = 0;
    if (queue.songs.length > MAX_PLAYLIST + 1) {
      // +1: çalan şarkıyı koru
      trimmed = queue.songs.length - (MAX_PLAYLIST + 1);
      queue.songs.splice(MAX_PLAYLIST + 1);
    }

    const addedCount = playlist.songs.length - trimmed;
    const desc = trimmed > 0
      ? `**[${playlist.name}](${playlist.url})**\n⚠️ Playlist ${playlist.songs.length} şarkı içeriyor, ilk **${addedCount}** şarkı eklendi (limit: ${MAX_PLAYLIST}).`
      : `**[${playlist.name}](${playlist.url})**`;

    const msg = await queue.textChannel?.send({
      embeds: [
        new EmbedBuilder().setColor(0x5865F2).setTitle('📋 Playlist Eklendi')
          .setDescription(desc)
          .addFields(
            { name: 'Şarkı Sayısı', value: `${addedCount} şarkı`, inline: true },
            { name: 'İsteyen', value: playlist.user?.toString() || 'Bilinmiyor', inline: true }
          ).setTimestamp(),
      ],
    }).catch(() => null);
    if (msg) {
      const msgs = lastAddSongMsgs.get(queue.id) || [];
      msgs.push(msg);
      lastAddSongMsgs.set(queue.id, msgs);
    }
  });

  distube.on('error', (error, queue) => {
    console.error('[DisTube Error]', error);
    let errorMsg = 'Bilinmeyen bir hata oluştu.';
    if (error.message?.includes('private')) errorMsg = 'Bu video/şarkı gizli.';
    else if (error.message?.includes('unavailable')) errorMsg = 'Bu içerik mevcut değil.';
    else if (error.message?.includes('age')) errorMsg = 'Bu içerik yaş kısıtlamalı.';
    else if (error.message?.includes('region')) errorMsg = 'Bu içerik bölgenizde mevcut değil.';
    queue?.textChannel?.send({ embeds: [createErrorEmbed('Oynatma Hatası', errorMsg)] });
  });

  distube.on('finish', async (queue) => {
    clearLive(queue.id);
    await deleteOldMessage(queue.id);
    queue.textChannel?.send({
      embeds: [new EmbedBuilder().setColor(0xFF6B6B).setTitle('✅ Kuyruk Bitti')
        .setDescription('Tüm şarkılar çalındı. Yeni şarkı için `/play` kullan!').setTimestamp()],
    }).then(m => setTimeout(() => m?.delete().catch(() => {}), 30000)).catch(() => {});
  });

  distube.on('disconnect', async (queue) => {
    clearLive(queue.id);
    await deleteOldMessage(queue.id);
    await deleteOldAddSongMsgs(queue.id);
    queue.textChannel?.send({
      embeds: [new EmbedBuilder().setColor(0xFF6B6B).setTitle('👋 Ses Kanalından Ayrıldım')
        .setDescription('Görüşürüz!').setTimestamp()],
    }).then(m => setTimeout(() => m?.delete().catch(() => {}), 10000)).catch(() => {});
  });

  distube.on('initQueue', (queue) => {
    queue.autoplay = false;
    queue.volume = getVolume(queue.id);
  });

  // ——— Buton etkileşimleri ———
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    const id = interaction.customId;

    // ——— Müzik kontrol butonları ———
    if (id.startsWith('ctrl_')) {
      const parts = id.split('_');
      const action = parts[1];
      const guildId = parts.slice(2).join('_');
      const queue = distube.getQueue(guildId);

      if (!queue) return interaction.reply({ content: 'Çalan bir şarkı yok.', ephemeral: true });
      if (!interaction.member.voice.channel) return interaction.reply({ content: 'Ses kanalında olmalısın!', ephemeral: true });

      try { await interaction.deferUpdate(); } catch { return; }

      try {
        if (action === 'pause') {
          if (queue.paused) await queue.resume();
          else await queue.pause();
          await updateNowPlayingMsg(guildId, distube);

        } else if (action === 'skip') {
          await queue.skip();
          // playSong eventi otomatik yeni mesaj gönderecek

        } else if (action === 'prev') {
          await queue.previous();
          // playSong eventi otomatik yeni mesaj gönderecek

        } else if (action === 'stop') {
          await queue.stop();

        } else if (action === 'replay') {
          await queue.seek(0);
          await updateNowPlayingMsg(guildId, distube);

        } else if (action === 'loop') {
          const next = ((queue.repeatMode ?? 0) + 1) % 3;
          queue.setRepeatMode(next);
          await updateNowPlayingMsg(guildId, distube);

        } else if (action === 'shuffle') {
          await queue.shuffle();
          await updateNowPlayingMsg(guildId, distube);

        } else if (action === 'queue') {
          const totalPages = Math.ceil(queue.songs.length / 10);
          await interaction.followUp({
            embeds: [buildQueueEmbed(queue, 1, totalPages)],
            ephemeral: true,
          });
          return;
        }
      } catch (err) {
        console.error('[Kontrol Butonu]', err);
      }
      return;
    }

    // ——— Like / Dislike butonları ———
    if (id.startsWith('like_')) {
      const guildId = id.replace('like_', '');
      const queue = distube.getQueue(guildId);
      if (!queue?.songs[0]) return interaction.reply({ content: 'Şarkı bulunamadı.', ephemeral: true });
      const added = addFavorite(interaction.user.id, queue.songs[0]);
      await interaction.reply({ content: added ? `❤️ **${queue.songs[0].name}** favorilerine eklendi!` : 'Zaten favorilerinde var!', ephemeral: true });
      return;
    }

    if (id.startsWith('dislike_')) {
      const msgs = ['Anladım, beğenmedin. Zevkler tartışılmaz 🙄', 'Tamam tamam, bir daha çalmam 😤', 'Sen beğenme, ben çalmaya devam ederim 😏', 'Hayal kırıklığına uğradım ama devam... 💔'];
      await interaction.reply({ content: msgs[Math.floor(Math.random() * msgs.length)], ephemeral: true });
    }
  });

  console.log("[Müzik] DisTube event handler'ları kuruldu.");
}

module.exports = { setupMusicEvents };
