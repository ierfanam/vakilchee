# راهنمای دپلوی برنامه وکیل هوشمند حقوقی

## ✅ وضعیت فعلی
برنامه با موفقیت بیلد شده و برای دپلوی آماده است. فایل‌های بیلد در پوشه `dist` قرار دارند.

## 🚀 روش‌های دپلوی

### روش ۱: دپلوی محلی (تست سریع)
```bash
# اجرای سرور محلی
npm run serve
# یا
npx serve dist -l 3000
```
برنامه در آدرس http://localhost:3000 در دسترس خواهد بود.

### روش ۲: دپلوی روی Firebase Hosting (توصیه شده)

#### پیش‌نیازها:
1. نصب Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. ورود به Firebase:
   ```bash
   firebase login
   ```

3. انتخاب پروژه:
   ```bash
   firebase use gen-lang-client-0394022571
   ```

#### اجرای دپلوی:
```bash
# روش خودکار (بیلد + دپلوی)
npm run deploy

# یا دستی
npm run build
firebase deploy --only hosting
```

### روش ۳: دپلوی روی هر سرور استاتیک

فایل‌های پوشه `dist` را روی هر سرور وب (Nginx, Apache, etc.) آپلود کنید.

#### تنظیمات Nginx:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # کش برای فایل‌های استاتیک
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|glb|mp3|exr)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 🔧 اسکریپت دپلوی خودکار

اسکریپت `deploy.sh` را اجرا کنید:
```bash
./deploy.sh
```

این اسکریپت:
1. پروژه را بیلد می‌کند
2. سرور محلی را اجرا می‌کند
3. سلامت برنامه را بررسی می‌کند

## 📊 مشخصات بیلد

- **حجم کل**: ~29MB
- **فایل‌های اصلی**:
  - `index.html`: صفحه اصلی
  - `assets/`: فایل‌های جاوااسکریپت و CSS فشرده
  - `logo.png`: لوگو برنامه
  - `discord.mp3`: فایل صوتی
  - `promptplay-male-1717.glb`: مدل سه‌بعدی
  - `piz_compressed.exr`: تکسچر محیطی
  - `ilam_power_bg.png`: تصویر پس‌زمینه

## 🔐 نکات امنیتی

- کلیدهای API باید در متغیرهای محیطی (.env) ذخیره شوند
- فایل `.env` نباید در git کامیت شود
- از Firebase App Check برای امنیت بیشتر استفاده کنید

## 🌐 دسترسی به برنامه

پس از دپلوی روی Firebase، برنامه در آدرس زیر قابل دسترسی است:
```
https://gen-lang-client-0394022571.web.app
```

یا اگر دامنه سفارشی تنظیم کرده‌اید:
```
https://your-custom-domain.com
```

## 🛠 عیب‌یابی

### خطای احراز هویت Firebase:
```bash
firebase logout
firebase login
```

### خطای بیلد:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### مشکلات کش مرورگر:
- Ctrl+Shift+R (رفرش سخت)
- یا پاک کردن کش مرورگر

## 📞 پشتیبانی

برای اطلاعات بیشتر به فایل `DEPLOYMENT_SUMMARY.md` مراجعه کنید.
