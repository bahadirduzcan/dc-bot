@echo off
title Zeythan-B Discord Bot
color 0A

echo.
echo  ================================
echo   Zeythan-B Discord Bot Baslatici
echo  ================================
echo.

:: Node.js yüklü mü kontrol et
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [HATA] Node.js bulunamadi! https://nodejs.org adresinden yukle.
    pause
    exit /b 1
)

:: .env dosyası var mı kontrol et
if not exist ".env" (
    echo [HATA] .env dosyasi bulunamadi!
    pause
    exit /b 1
)

:: node_modules yüklü mü kontrol et
if not exist "node_modules" (
    echo [*] Paketler yukleniyor...
    call npm install
    if %errorlevel% neq 0 (
        echo [HATA] npm install basarisiz!
        pause
        exit /b 1
    )
)

:: Slash komutlarını deploy et
echo [*] Slash komutlari kaydediliyor...
call npm run deploy
if %errorlevel% neq 0 (
    echo [HATA] Komutlar kaydedilemedi!
    pause
    exit /b 1
)

echo.
echo [*] Bot baslatiliyor...
echo  Durdurmak icin Ctrl+C kullan.
echo.

:: Botu başlat
call npm start

echo.
echo Bot kapandi.
pause
