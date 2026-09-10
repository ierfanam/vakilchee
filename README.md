# وکیل‌چی

سامانه فارسی هوشمند مشاوره و دستیار حقوقی با رابط زنده، تحلیل اسناد، حافظه کاربر و تولید فرم‌های حقوقی.

## وضعیت پروژه

این مخزن دو هدف اجرایی دارد:

- **Web/Vite + TypeScript + Lit + Three.js**: رابط اصلی فعلی و امکانات زنده صوتی/تصویری.
- **Flutter**: پوسته/نسخه چندسکویی در حال توسعه.

قبل از انتشار تجاری، مسیر Web را به عنوان محصول اصلی انتخاب و مسیر Flutter را به‌صورت مستقل تکمیل کنید؛ نگه‌داشتن دو UI مستقل بدون تصمیم معماری، هزینه نگهداری را بالا می‌برد.

## اجرای Web

```bash
npm install
npm run dev
```

بررسی قبل از انتشار:

```bash
npm run typecheck
npm run build
```

یا:

```bash
npm run check
```

## متغیرهای محیطی

فایل `.env.example` نمونه تنظیمات توسعه است. فایل `.env` واقعی نباید commit شود.

**هشدار امنیتی مهم:** هر متغیری که توسط Vite وارد bundle مرورگر شود، secret محسوب نمی‌شود. بنابراین یک Gemini API key بلندمدت را مستقیماً در frontend برای محصول تجاری قرار ندهید. برای انتشار واقعی، تماس‌های مدل را پشت backend/proxy امن یا سازوکار token کوتاه‌عمر قرار دهید و rate limit، quota و logging را در سمت سرور اعمال کنید.

## Firebase

احراز هویت و Firestore برای هر کاربر به مسیر `users/{uid}` محدود شده‌اند. مجموعه‌های مورد استفاده فعلی عبارت‌اند از:

- `memories`
- `sessions`
- `documents`
- `judicial_forms`

قوانین Firestore عمداً دسترسی به مجموعه‌های ناشناخته را باز نمی‌گذارند.

## نسخه Flutter

```bash
flutter pub get
flutter analyze
flutter test
```

## کنترل کیفیت

GitHub Actions در هر push به `main` و شاخه‌های `production/**` و همچنین Pull Request به `main` این موارد را بررسی می‌کند:

1. TypeScript typecheck
2. Vite production build
3. Flutter analyzer
4. Flutter widget tests

## چک‌لیست انتشار تجاری

قبل از Final Release این موارد باید تکمیل و تأیید شوند:

- [ ] انتقال کلید Gemini از frontend به backend/token service امن
- [ ] تعیین provider و قرارداد رسمی استقرار Firebase
- [ ] فعال‌سازی rate limiting، quota و abuse protection
- [ ] تعریف سیاست نگهداری/حذف اسناد و داده‌های کاربر
- [ ] بررسی حقوقی متن‌های «دستیار حقوقی» و disclaimer؛ سیستم نباید خود را وکیل دارای پروانه معرفی کند مگر واقعاً مجوز و هویت قابل احراز وجود داشته باشد
- [ ] تست مجوزهای Firestore با Emulator/CI
- [ ] تست مرورگرهای Chrome/Edge/Firefox و موبایل
- [ ] تست microphone/camera permission و سناریوهای قطع اینترنت
- [ ] تست بارگذاری فایل‌های بزرگ، فایل خراب و MIME type غیرمجاز
- [ ] تست خروجی PDF/Word و فونت فارسی
- [ ] حذف assetهای غیرضروری و بهینه‌سازی bundle
- [ ] ثبت نسخه، changelog و فرآیند rollback
- [ ] تعریف مانیتورینگ، error tracking و alerting
- [ ] تهیه Terms of Service و Privacy Policy متناسب با محل استقرار و بازار هدف

## اصل مهم محصول

این پروژه برای کاربرد حقوقی حساس است. پاسخ مدل باید به‌عنوان **کمک اطلاعاتی و تحلیلی** ارائه شود، نه تضمین نتیجه قضایی. برای قوانین و مقررات زمان‌مند، در محصول نهایی باید منبع و تاریخ اعتبار داده‌های حقوقی قابل ردیابی باشد.
