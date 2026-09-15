#!/bin/bash
set -e

echo "🚀 شروع فرآیند دپلوی..."

# 1. بیلد پروژه
echo "📦 در حال بیلد پروژه..."
npm run build

# 2. سرویس محلی برای تست
echo "✅ بیلد با موفقیت انجام شد!"
echo "🌐 اجرای سرور محلی روی پورت 3000..."
npx serve dist -l 3000 &
SERVE_PID=$!

sleep 3

# بررسی سلامت سرویس
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ سرور محلی با موفقیت اجرا شد!"
    echo "🌐 برنامه در دسترس است: http://localhost:3000"
else
    echo "❌ خطا در اجرای سرور محلی"
    kill $SERVE_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ دپلوی محلی با موفقیت انجام شد!"
echo "=========================================="
echo "برنامه در آدرس http://localhost:3000 در دسترس است"
echo ""
echo "برای دپلوی روی Firebase Hosting:"
echo "1. اجرای دستور: firebase login"
echo "2. اجرای دستور: npm run deploy"
echo ""
echo "برای توقف سرور محلی: kill $SERVE_PID"
echo "=========================================="

# نگه داشتن سرور در حالت اجرا
wait $SERVE_PID
