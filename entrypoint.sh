#!/bin/sh

if [ -n "$YOUTUBE_COOKIES_BASE64" ]; then
    echo "$YOUTUBE_COOKIES_BASE64" | base64 -d > /app/cookies.txt
    echo "[bot] YouTube cookies yüklendi."
else
    echo "[bot] UYARI: YOUTUBE_COOKIES_BASE64 ayarlanmamış. Cookies olmadan YouTube engellenebilir."
fi

if [ -n "$YTDLP_PROXY" ]; then
    echo "[bot] Proxy aktif: $YTDLP_PROXY"
else
    echo "[bot] UYARI: YTDLP_PROXY ayarlanmamış. Sunucu IP'si engellenebilir."
fi

# yt-dlp binary güncelle (arka planda, botu bloklamadan)
YTDLP_BIN="/app/node_modules/@distube/yt-dlp/bin/yt-dlp"
if [ -f "$YTDLP_BIN" ]; then
    echo "[bot] yt-dlp güncelleniyor..."
    "$YTDLP_BIN" -U 2>&1 | tail -1 || true
fi

exec /usr/bin/tini -- "$@"
