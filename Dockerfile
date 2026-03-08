FROM node:20-slim

# ffmpeg (ses), tini (düzgün process yönetimi), curl (yt-dlp indirme)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg tini curl ca-certificates python3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Önce sadece package.json kopyala (cache optimizasyonu)
COPY package*.json ./
RUN npm install --omit=dev

# @distube/yt-dlp plugin'ini patch'le:
# - noCallHome deprecated uyarısını kaldır
# - YouTube bot koruması için iOS player client ekle
# - runtime'da /app/cookies.txt varsa otomatik kullan
COPY patch-yt-dlp.js ./
RUN node patch-yt-dlp.js

# yt-dlp binary'yi build sırasında indir
RUN mkdir -p /app/node_modules/@distube/yt-dlp/bin && \
    curl -L "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp" \
         -o /app/node_modules/@distube/yt-dlp/bin/yt-dlp && \
    chmod +x /app/node_modules/@distube/yt-dlp/bin/yt-dlp

# Kaynak kodunu kopyala
COPY . .

# Entrypoint scriptini çalıştırılabilir yap
RUN chmod +x /app/entrypoint.sh

# Data klasörünü oluştur (volume mount noktası)
RUN mkdir -p data

# entrypoint.sh: YOUTUBE_COOKIES_BASE64 env varından cookie dosyası oluşturur
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["sh", "-c", "node deploy-commands.js && node src/index.js"]
