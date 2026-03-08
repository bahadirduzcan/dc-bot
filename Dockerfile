FROM node:20-slim

# ffmpeg (ses), tini (düzgün process yönetimi), curl (yt-dlp indirme)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg tini curl ca-certificates python3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Önce sadece package.json kopyala (cache optimizasyonu)
COPY package*.json ./
RUN npm install --omit=dev

# yt-dlp binary'yi build sırasında indir (her container restart'ta indirmemek için)
RUN mkdir -p /app/node_modules/@distube/yt-dlp/bin && \
    curl -L "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp" \
         -o /app/node_modules/@distube/yt-dlp/bin/yt-dlp && \
    chmod +x /app/node_modules/@distube/yt-dlp/bin/yt-dlp

# Kaynak kodunu kopyala
COPY . .

# Data klasörünü oluştur (volume mount noktası)
RUN mkdir -p data

# tini ile başlat: SIGTERM/SIGINT düzgün iletilir
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["sh", "-c", "node deploy-commands.js && node src/index.js"]
