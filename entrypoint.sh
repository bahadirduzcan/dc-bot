#!/bin/sh

if [ -n "$YOUTUBE_COOKIES_BASE64" ]; then
    echo "$YOUTUBE_COOKIES_BASE64" | base64 -d > /app/cookies.txt
    echo "[yt-dlp] YouTube cookies yüklendi."
else
    echo "[yt-dlp] YOUTUBE_COOKIES_BASE64 ayarlanmamış, cookies olmadan devam ediliyor."
fi

if [ -n "$YTDLP_PROXY" ]; then
    echo "[yt-dlp] Proxy aktif: $YTDLP_PROXY"
else
    echo "[yt-dlp] UYARI: YTDLP_PROXY ayarlanmamış! Sunucu IP'si YouTube tarafından engellenebilir."
fi

exec /usr/bin/tini -- "$@"
