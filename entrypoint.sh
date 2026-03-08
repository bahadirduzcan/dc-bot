#!/bin/sh

# YOUTUBE_COOKIES_BASE64 env varı varsa cookies.txt dosyasına yaz
if [ -n "$YOUTUBE_COOKIES_BASE64" ]; then
    echo "$YOUTUBE_COOKIES_BASE64" | base64 -d > /app/cookies.txt
    echo "[yt-dlp] YouTube cookies yüklendi."
else
    echo "[yt-dlp] YOUTUBE_COOKIES_BASE64 bulunamadı, cookies olmadan devam ediliyor."
fi

exec /usr/bin/tini -- "$@"
