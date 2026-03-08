# All-in-One Discord Bot - Muzik Modulu

YouTube, Spotify, SoundCloud ve daha fazlasindan muzik calan bir Discord botu.

## Ozellikler

- **YouTube** - Video ve playlist destegi
- **Spotify** - Sarki ve playlist destegi
- **SoundCloud** - Tam destek
- **Slash Komutlari** - Modern Discord UI
- **Kuyruk Sistemi** - Sayfali kuyruk goruntuleme
- **Loop Modu** - Sarki veya kuyruk dongusu
- **Progress Bar** - Calan sarkida ilerleme gostergesi
- **Auto-leave** - Kanal bosaldiginda otomatik ayrilma
- **Volume Kontrol** - %1-100 arasi ses seviyesi

## Komutlar

| Komut | Aciklama |
|-------|----------|
| `/play <sorgu>` | YouTube/Spotify/SoundCloud cal |
| `/skip` | Sonraki sarkiya gec |
| `/stop` | Muzigi durdur ve kuyrugu temizle |
| `/pause` | Muzigi duraklat |
| `/resume` | Muzigi devam ettir |
| `/queue [sayfa]` | Kuyrugu goster |
| `/nowplaying` | Calan sarki + progress bar |
| `/volume <1-100>` | Ses seviyesi ayarla |
| `/shuffle` | Kuyrugu karistir |
| `/loop <off\|song\|queue>` | Dongu modu |
| `/seek <saniye>` | Belirli konuma git |
| `/remove <sira>` | Kuyruktan sarki kaldir |
| `/autoplay` | Otomatik sarki onerisini ac/kapat |
| `/help` | Tum komutlari goster |
| `/ping` | Bot gecikmesi |

## Kurulum

### 1. Discord Bot Olustur

1. [Discord Developer Portal](https://discord.com/developers/applications)'a git
2. **"New Application"** → Isim ver → **"Create"**
3. Sol menudan **"Bot"** → **"Add Bot"**
4. **Token**'i kopyala (bir daha goremezsin!)
5. **"Privileged Gateway Intents"** bolumunde sunlari AC:
   - SERVER MEMBERS INTENT
   - MESSAGE CONTENT INTENT
6. Sol menudan **"OAuth2"** → **"URL Generator"**
   - Scopes: `bot` + `applications.commands`
   - Bot Permissions: `Connect`, `Speak`, `Send Messages`, `Embed Links`, `Read Message History`, `Use Slash Commands`
7. Altta cikan URL ile botu sunucuna ekle

### 2. Client ID ve Guild ID Al

- **Client ID**: Developer Portal → Uygulamanin adi → "Application ID"
- **Guild ID**: Discord'da sunucuna sag tikla → "Sunucu ID'sini Kopyala" (Gelistirici Modu acik olmali)
  - Gelistirici Modu: Ayarlar → Gelismis → Gelistirici Modu: ACIK

### 3. .env Dosyasini Olustur

```bash
cp .env.example .env
```

`.env` dosyasini ac ve degerleri gir:

```env
DISCORD_TOKEN=MTI...  # Bot tokenin
CLIENT_ID=1234...     # Application ID
GUILD_ID=5678...      # Sunucu ID (test icin)
```

### 4. Bagimlilikları Yukle

```bash
npm install
```

> **Not:** `@distube/yt-dlp` ilk calismada yt-dlp binary'sini otomatik indirir (~10MB). Internet baglantisi gerekir.

### 5. Slash Komutlarini Kaydet

```bash
npm run deploy
# veya
node deploy-commands.js
```

### 6. Botu Baslat

```bash
npm start
# veya
node src/index.js
```

## Gelistirme Modu

Dosya degisikliklerinde otomatik yeniden baslama (Node.js v18+):

```bash
npm run dev
```

## Sik Sorulan Sorular

### YouTube sarkilari calmiyor?
- `@distube/yt-dlp` paketin binary'yi indirdiginden emin ol
- Node.js v18+ kullaniyor olmalisin
- Internet baglantini kontrol et

### "Bu video bolgeni desteklemiyor" hatasi?
- Bu normal bir YouTube kisitlamasi
- Farkli bir link dene

### Komutlar gorunmuyor?
- `npm run deploy` komutunu calistirdigindan emin ol
- GUILD_ID dogru mu kontrol et
- Botu sunucudan cikarip tekrar ekle

### Bot ses kanalina baglanmiyor?
- Bota `Connect` ve `Speak` izinleri ver
- Ses kanalinin kullanici limiti dolu mu kontrol et

## Proje Yapisi

```
discord-bot/
├── src/
│   ├── index.js              # Giris noktasi
│   ├── bot.js                # Client ve DisTube kurulumu
│   ├── commands/
│   │   ├── music/            # Muzik komutlari
│   │   └── general/          # Genel komutlar
│   ├── events/               # Discord eventleri
│   ├── handlers/             # Komut/event yukleyiciler
│   └── utils/                # Yardimci fonksiyonlar
├── deploy-commands.js        # Slash komut kaydedici
├── .env                      # Gizli degerler (git'e eklenmez)
├── .env.example              # Ornek env dosyasi
└── package.json
```

## Lisans

MIT
