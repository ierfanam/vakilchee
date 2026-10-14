# راهنمای دپلوی پروژه وکیل هوشمند حقوقی

## خلاصه تغییرات اعمال شده

### گام‌های ۴-۶ و ۷ انجام شدند:

#### ۴. بهینه‌سازی عملکرد (Performance Optimization)
- ✅ تقسیم کد با `manualChunks` در Vite config
- ✅ حذف console و debugger در بیلد تولید
- ✅ فشرده‌سازی با esbuild
- ✅ Lazy loading برای ماژول‌های سنگین (Firebase, Three.js, GenAI)

#### ۵. تست و کیفیت کد (Testing & Code Quality)
- ✅ افزودن Prettier با تنظیمات موجود
- ✅ اسکریپت‌های lint و format در package.json
- ✅ TypeScript strict mode فعال است

#### ۶. تجربه کاربری (UX)
- ✅ مدیریت خطاها در کد موجود
- ✅ پشتیبانی از RTL و فونت‌های فارسی
- ✅ عنوان فارسی و meta tagهای مناسب

#### ۷. تنظیمات Vite (Vite Configuration)
- ✅ target: esnext برای بهینه‌ترین بیلد
- ✅ minify: esbuild برای سرعت بیشتر
- ✅ manualChunks برای تقسیم بهینه bundle
- ✅ حذف console/debugger در production
- ✅ Cache-Control headers برای assets

## ساختار فایل‌های دپلوی

```
/workspace
├── dist/                  # خروجی بیلد آماده دپلوی
│   ├── index.html
│   ├── assets/           # فایل‌های JS/CSS فشرده
│   ├── logo.png
│   └── ...               # سایر assets
├── firebase.json         # پیکربندی Firebase Hosting
├── .firebaserc           # پروژه پیش‌فرض Firebase
├── firestore.rules       # قوانین امنیتی Firestore
└── DEPLOYMENT.md         # این فایل
```

## روش‌های دپلوی

### روش ۱: دپلوی روی Firebase Hosting (توصیه شده)

**پیش‌نیازها:**
1. نصب Firebase CLI: `npm install -g firebase-tools`
2. لاگین به Firebase: `firebase login`
3. داشتن پروژه Firebase با ID: `gen-lang-client-0394022571`

**مراحل دپلوی:**
```bash
# بیلد پروژه
npm run build

# دپلوی روی Firebase Hosting
firebase deploy --only hosting
```

**خروجی:** برنامه روی `https://gen-lang-client-0394022571.firebaseapp.com` قابل دسترسی خواهد بود.

### روش ۲: دپلوی روی هر سرویس Static Hosting

**سرویس‌های سازگار:**
- Vercel
- Netlify
- GitHub Pages
- Cloudflare Pages
- AWS S3 + CloudFront

**مراحل عمومی:**
1. اجرای `npm run build`
2. آپلود محتوای پوشه `dist/` روی سرویس میزبانی
3. تنظیم SPA Routing (تمام درخواست‌ها به index.html هدایت شوند)

### روش ۳: اجرای لوکال با serve

```bash
# نصب serve
npm install -g serve

# اجرای سرور production
serve -s dist -l 3000
```

برنامه روی `http://localhost:3000` در دسترس است.

## تنظیمات بهینه‌سازی شده

### Headers (در firebase.json)
- CSS و JS files: Cache-Control max-age=31536000 (1 سال)
- تصاویر و media: Cache-Control max-age=31536000 (1 سال)
- Clean URLs فعال است
- Trailing slash غیرفعال است

### Bundle Splitting
- `vendor`: lit, three.js
- `firebase`: تمام ماژول‌های Firebase
- `genai`: Google GenAI SDK
- `utils`: html2canvas, jspdf
- `index`: کد اصلی برنامه

## متغیرهای محیطی مورد نیاز

یک فایل `.env` در ریشه پروژه ایجاد کنید:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

**نکته مهم:** کلید API باید قبل از بیلد تنظیم شود زیرا Vite آن را در زمان بیلد inject می‌کند.

## بررسی نهایی قبل از دپلوی

```bash
# 1. بیلد بدون خطا
npm run build

# 2. بررسی فرمت کد
npm run format:check

# 3. بررسی TypeScript
npm run lint

# 4. تست لوکال
serve -s dist -l 3000
```

## عیب‌یابی

### مشکل: خطای API Key
- مطمئن شوید `.env` فایل وجود دارد
- کلید GEMINI_API_KEY را بررسی کنید
- دوباره بیلد بگیرید: `npm run build`

### مشکل: Firebase Authentication
- دستور `firebase login` را اجرا کنید
- مطمئن شوید به پروژه صحیح دسترسی دارید

### مشکل: Assets لود نمی‌شوند
- بررسی کنید مسیر public assets صحیح است
- CORS headers را بررسی کنید

## پشتیبانی

برای اطلاعات بیشتر مستندات Firebase Hosting را مطالعه کنید:
https://firebase.google.com/docs/hosting
