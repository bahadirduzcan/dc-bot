# Discord All-in-One Bot - Plan

## Hedef
YouTube, Spotify, SoundCloud ve diğer kaynaklardan müzik çalan,
slash komutlarıyla çalışan, stabil ve güvenilir bir Discord müzik botu.

## Teknoloji Seçimleri

### Neden Bu Kütüphaneler?

| Kütüphane | Versiyon | Neden |
|-----------|---------|-------|
| `discord.js` | v14 | En güncel, Slash Command desteği |
| `distube` | v4 | Hazır queue sistemi, event-driven mimari |
| `@distube/yt-dlp` | latest | yt-dlp binary ile YouTube bot engelini aşar |
| `@distube/spotify` | latest | Spotify link desteği |
| `@distube/soundcloud` | latest | SoundCloud desteği |
| `@discordjs/voice` | latest | Ses bağlantısı (DisTube bağımlılığı) |
| `ffmpeg-static` | latest | Manuel kurulum gerekmez, otomatik FFmpeg |
| `dotenv` | latest | .env ile güvenli token yönetimi |

### YouTube Engel Sorunu Çözümü
`@distube/yt-dlp` paketi:
- yt-dlp binary'sini otomatik indirir (ilk çalıştırmada)
- YouTube'un bot tespitini aşar
- Düzenli güncellemeyle yeni YouTube korumasına uyum sağlar
- Cookie desteği (isteğe bağlı, ek güvenilirlik için)

**Kullanıcı hesabı GEREKMEZ** - yt-dlp anonim olarak çalışır.
Eğer YouTube sık engelliyor olursa, cookie.txt eklemek yeterlidir.

## Proje Yapısı

```
discord-bot/
├── src/
│   ├── index.js                 # Giriş noktası
│   ├── bot.js                   # Client ve DisTube setup
│   ├── commands/
│   │   ├── music/
│   │   │   ├── play.js          # /play <şarkı/link>
│   │   │   ├── skip.js          # /skip
│   │   │   ├── stop.js          # /stop
│   │   │   ├── pause.js         # /pause
│   │   │   ├── resume.js        # /resume
│   │   │   ├── queue.js         # /queue (sayfalı)
│   │   │   ├── nowplaying.js    # /nowplaying (progress bar)
│   │   │   ├── volume.js        # /volume <1-100>
│   │   │   ├── shuffle.js       # /shuffle
│   │   │   ├── loop.js          # /loop <off|song|queue>
│   │   │   ├── seek.js          # /seek <saniye>
│   │   │   ├── remove.js        # /remove <sıra>
│   │   │   └── autoplay.js      # /autoplay
│   │   └── general/
│   │       ├── help.js          # /help
│   │       └── ping.js          # /ping
│   ├── events/
│   │   ├── ready.js             # Bot hazır eventi
│   │   ├── interactionCreate.js # Slash command handler
│   │   └── voiceStateUpdate.js  # Ses kanalı kontrol
│   ├── handlers/
│   │   ├── commandHandler.js    # Komut yükleyici
│   │   ├── eventHandler.js      # Event yükleyici
│   │   └── musicHandler.js      # DisTube event handler
│   └── utils/
│       ├── embed.js             # Embed oluşturucu
│       └── helpers.js           # Yardımcı fonksiyonlar
├── deploy-commands.js           # Slash komut kaydedici
├── .env                         # Token ve config (git'e eklenmez)
├── .env.example                 # Örnek env dosyası
├── .gitignore
├── package.json
└── plan.md                      # Bu dosya
```

## Komutlar

### Müzik Komutları
| Komut | Açıklama |
|-------|----------|
| `/play <şarkı/link>` | YouTube/Spotify/SoundCloud çal |
| `/skip` | Sonraki şarkıya geç |
| `/stop` | Müziği durdur ve kuyruktan çık |
| `/pause` | Müziği duraklat |
| `/resume` | Müziği devam ettir |
| `/queue` | Kuyruğu göster (sayfalı) |
| `/nowplaying` | Çalan şarkı + progress bar |
| `/volume <1-100>` | Ses seviyesi ayarla |
| `/shuffle` | Kuyruğu karıştır |
| `/loop <off\|song\|queue>` | Döngü modu |
| `/seek <saniye>` | Belirli konuma git |
| `/remove <sıra>` | Kuyruktan şarkı sil |
| `/autoplay` | Otomatik şarkı önerisi aç/kapat |

### Genel Komutlar
| Komut | Açıklama |
|-------|----------|
| `/help` | Tüm komutları göster |
| `/ping` | Bot gecikmesini göster |

## Kurulum Adımları

### 1. Discord Bot Oluşturma
1. https://discord.com/developers/applications adresine git
2. "New Application" → isim ver
3. Sol menüden "Bot" → "Add Bot"
4. Token'ı kopyala → `.env` dosyasına ekle
5. OAuth2 → URL Generator → `bot` + `applications.commands` seç
6. Bot Permissions: `Connect`, `Speak`, `Send Messages`, `Embed Links`, `Read Message History`
7. Oluşan linki kullanarak botu sunucuna ekle

### 2. Developer Mode (Gerekli)
- Discord Ayarlar → Gelişmiş → Geliştirici Modu: AÇIK
- Bu, GUILD_ID almak için gerekli

### 3. .env Dosyası
```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
GUILD_ID=your_guild_id_here  # Test için, prod'da kaldır
```

### 4. Kurulum Komutları
```bash
npm install
node deploy-commands.js    # Slash komutları kaydet
node src/index.js          # Botu başlat
```

## Güvenilirlik Notları

- `@distube/yt-dlp` ilk çalıştırmada yt-dlp binary'sini indirir (~10MB)
- FFmpeg `ffmpeg-static` ile otomatik gelir, kurulum gerekmez
- YouTube cookie desteği eklenebilir (isteğe bağlı, `.env`'den alınır)
- Ses kanalı boşaldığında bot otomatik ayrılır (voiceStateUpdate)
- Hata mesajları kullanıcı dostu Türkçe embed'lerle gösterilir

## İleride Eklenebilir Modüller
- Moderasyon komutları (ban, kick, mute)
- Hoşgeldin sistemi
- Rol yönetimi
- Ekonomi sistemi
- Ticket sistemi
