import { JudicialFormData } from './firebase';

export interface FormTypeOption {
  id: JudicialFormData['formType'];
  title: string;
  shortName: string;
  authority: string;
  badgeColor: string;
}

export const JUDICIAL_FORM_TYPES: FormTypeOption[] = [
  {
    id: 'dadkhast',
    title: 'برگ دادخواست نخستین به دادگاه عمومی حقوقی',
    shortName: 'دادخواست حقوقی',
    authority: 'دادگاه عمومی حقوقی دادگستری',
    badgeColor: '#d4af37',
  },
  {
    id: 'shekayat',
    title: 'برگ شکواییه به دادسرا و مراجع کیفری',
    shortName: 'شکواییه کیفری',
    authority: 'دادسرا و دادگاه کیفری دو',
    badgeColor: '#ef4444',
  },
  {
    id: 'ezharnameh',
    title: 'برگ اظهارنامه رسمی (ماده ۱۵۶ قانون آیین دادرسی مدنی)',
    shortName: 'اظهارنامه رسمی',
    authority: 'دفتر خدمات الکترونیک قضایی / دادگستری',
    badgeColor: '#3b82f6',
  },
  {
    id: 'layehe',
    title: 'برگ لایحه دفاعیه و توضیحی به مراجع قضایی',
    shortName: 'لایحه دفاعیه',
    authority: 'شعبه رسیدگی‌کننده دادگاه / تجدیدنظر',
    badgeColor: '#10b981',
  },
  {
    id: 'shora',
    title: 'برگ دادخواست به شورای حل اختلاف',
    shortName: 'دادخواست شورای حل اختلاف',
    authority: 'شورای حل اختلاف دادگستری',
    badgeColor: '#8b5cf6',
  },
  {
    id: 'tamin',
    title: 'برگ درخواست صدور قرار تامین خواسته / دستور موقت',
    shortName: 'تامین خواسته',
    authority: 'دادگاه عمومی حقوقی',
    badgeColor: '#f59e0b',
  },
  {
    id: 'divan',
    title: 'برگ دادخواست به دیوان عدالت اداری',
    shortName: 'دادخواست دیوان عدالت',
    authority: 'شعب بدوی و تجدیدنظر دیوان عدالت اداری',
    badgeColor: '#06b6d4',
  },
];

export function generateSampleJudicialForm(type: JudicialFormData['formType'] = 'dadkhast'): JudicialFormData {
  const dateStr = new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  const trackingNum = '1405' + Math.floor(1000000000 + Math.random() * 9000000000).toString();

  switch (type) {
    case 'shekayat':
      return {
        formType: 'shekayat',
        title: 'برگ شکواییه کیفری به دادسرای عمومی و انقلاب',
        authorityName: 'دادسرای عمومی و انقلاب ناحیه مجری رسیدگی',
        trackingCode: trackingNum,
        filingDate: dateStr,
        branchNumber: 'شعبه بازپرسی / دادیاری ویژه',
        claimant: {
          name: 'شاکی (نام و نام خانوادگی موکل)',
          fatherName: 'نام پدر',
          nationalId: 'کد ملی ده رقمی',
          job: 'شاغل',
          address: 'تهران، اقامتگاه قانونی شاکی مطابق سامانه ثنا',
          phone: '۰۹۱۲۰۰۰۰۰۰۰',
        },
        respondent: {
          name: 'مشتکی‌عنه (نام متهم یا کلاهبردار / شرکت)',
          fatherName: 'نام پدر متهم در صورت اطلاع',
          nationalId: 'نامشخص / درج در سامانه',
          job: 'آزاد',
          address: 'نشانی مشتکی‌عنه یا مجهول‌المکان',
          phone: '۰۹۱۲-------',
        },
        attorney: {
          name: 'وکیل پایه یک دادگستری',
          licenseNumber: 'پروانه وکالت رسمی دادگستری',
        },
        subject: 'شکایت دایر بر کلاهبرداری، تحصیل مال از طریق نامشروع و خیانت در امانت',
        evidences: [
          'تصویر مصدق فیش‌های واریزی بانکی به حساب مشتکی‌عنه',
          'تصویر پرینت پیامک‌ها و گفتگوهای حاوی اقرار و فریب',
          'استعلام از سامانه بانکی و تراکنش‌ها',
          'شهادت شهود و مطلعین و استشهادیه محلی',
        ],
        legalBasis: 'ماده ۱ و ۲ قانون تشدید مجازات مرتکبین ارتشاء، اختلاس و کلاهبرداری و ماده ۶۷۴ قانون مجازات اسلامی',
        bodyText: `ریاست و دادستان محترم دادسرای عمومی و انقلاب\n\nبا سلام و تحیات وافره و ادای احترام؛\nاحتراماً به وکالت از شاکی به استحضار عالی می‌رساند:\n\nمشتکی‌عنه با توسل به وسایل متقلبانه و مانورهای فریبکارانه، موکل را به امور غیرواقع و سودهای واهی امیدوار ساخته و مبالغی را به عنوان سرمایه‌گذاری دریافت نموده و متعاقباً از استرداد اصل وجوه و تحویل کالا امتناع ورزیده و اقدام به حیف و میل و بردن مال غیر نموده است.\n\nبنا به مراتب مسطوره و با توجه به انطباق عمل ارتکابی با ارکان مادی و معنوی جرم کلاهبرداری، مستنداً به ماده ۱ قانون تشدید مجازات مرتکبین ارتشاء و اختلاس و کلاهبرداری، تقاضای تعقیب کیفری، صدور قرار جلب به دادرسی و مجازات قانونی متهم و همچنین جبران کلیه خسارات وارده و رد مال را از محضر محترم قضایی استدعا دارد.`,
      };

    case 'ezharnameh':
      return {
        formType: 'ezharnameh',
        title: 'برگ اظهارنامه رسمی - موضوع ماده ۱۵۶ قانون آیین دادرسی مدنی',
        authorityName: 'دفتر خدمات الکترونیک قضایی و اداره ابلاغ دادگستری',
        trackingCode: trackingNum,
        filingDate: dateStr,
        branchNumber: 'دایره ابلاغ اظهارنامه دادگستری',
        claimant: {
          name: 'اظهارکننده (نام موکل)',
          fatherName: 'نام پدر',
          nationalId: 'کد ملی ده رقمی',
          job: 'کاسب / کارمند',
          address: 'اقامتگاه قانونی اظهارکننده ثبت‌شده در ثنا',
          phone: '۰۹۱۲۰۰۰۰۰۰۰',
        },
        respondent: {
          name: 'مخاطب اظهارنامه (نام متعهد یا بدهکار)',
          fatherName: 'نام پدر مخاطب',
          nationalId: 'کد ملی مخاطب',
          job: 'آزاد',
          address: 'نشانی دقیق محل اقامت یا محل کسب مخاطب',
          phone: '۰۹۱۲-------',
        },
        attorney: {
          name: 'وکیل پایه یک دادگستری',
          licenseNumber: 'پروانه وکالت دادگستری',
        },
        subject: 'اخطار رسمی و قانونی جهت انجام تعهد قراردادی / پرداخت وجه و تخلیه عین مستاجره',
        evidences: [
          'تصویر مصدق قرارداد / سند مالکیت',
          'تصویر فیش‌های واریزی و مکاتبات سابق',
          'گواهی عدم حضور / استعلام بانکی',
        ],
        legalBasis: 'ماده ۱۵۶ قانون آیین دادرسی دادگاه‌های عمومی و انقلاب در امور مدنی',
        bodyText: `مخاطب محترم؛\nبا سلام؛\nاحتراماً مطابق ماده ۱۵۶ قانون آیین دادرسی مدنی، مراتب ذیل رسماً و قانوناً به جنابعالی ابلاغ می‌گردد:\n\nنظر به اینکه به موجب قرارداد فی‌مابین، متعهد گردیده بودید در موعد مقرر نسبت به انجام تعهدات قانونی خویش اقدام فرمایید، لکن علیرغم مراجعات و تذکرات شفاهی، تاکنون از ایفای تعهد سر باز زده‌اید.\n\nفلذا با ابلاغ این اظهارنامه رسمی به شما مهلت داده می‌شود ظرف مدت ۱۰ روز از تاریخ ابلاغ نسبت به انجام تعهد و تسویه‌حساب اقدام فرمایید. بدیهی است در صورت انقضای مهلت و عدم اقدام، اینجانب از طریق مراجع صالحه قضایی دادگستری اقدام به طرح دعوا نموده و کلیه خسارات تاخیر تادیه، هزینه‌های دادرسی و حق‌الوکاله وکیل متوجه شما خواهد بود.`,
      };

    case 'layehe':
      return {
        formType: 'layehe',
        title: 'برگ لایحه دفاعیه و مستندات قانونی',
        authorityName: 'شعبه محترم دادگاه عمومی حقوقی / تجدیدنظر',
        trackingCode: trackingNum,
        filingDate: dateStr,
        branchNumber: 'شعبه ۱۰۲ دادگاه حقوقی مجتمع قضایی',
        claimant: {
          name: 'خواهان / تجدیدنظرخواه (موکل)',
          fatherName: 'نام پدر',
          nationalId: 'کد ملی موکل',
          job: 'شاغل',
          address: 'اقامتگاه ثبت‌شده در سامانه ابلاغ ثنا',
          phone: '۰۹۱۲۰۰۰۰۰۰۰',
        },
        respondent: {
          name: 'خوانده / تجدیدنظرخوانده',
          fatherName: 'نام پدر',
          nationalId: 'کد ملی',
          job: 'آزاد',
          address: 'اقامتگاه خوانده',
          phone: '۰۹۱۲-------',
        },
        attorney: {
          name: 'وکیل پایه یک دادگستری',
          licenseNumber: 'پروانه وکالت رسمی دادگستری',
        },
        subject: 'لایحه دفاعیه در پاسخ به ادعای واهی خوانده و اثبات حقانیت موکل در پرونده کلاسه ...',
        evidences: [
          'مفاد صریح قرارداد و شروط ضمن عقد',
          'قاعده فقهی اقدام و لزوم وفای به عهد',
          'استعلام از اداره ثبت اسناد و املاک کشور',
          'نظریه تکمیلی کارشناس رسمی دادگستری',
        ],
        legalBasis: 'مواد ۱۰، ۲۱۹، ۲۲۰، ۲۲۵ و ۲۳۰ قانون مدنی و مواد ۱۹۸ و ۵۱۹ قانون آیین دادرسی مدنی',
        bodyText: `ریاست و مستشاران محترم دادگاه صالحه؛\nبا سلام و اهدای تحیات شایسته قضایی؛\nاحتراماً در خصوص پرونده کلاسه فوق‌الذکر، دفاعیات موکل به شرح ذیل به حضور اعلام می‌گردد:\n\n۱. ادعای طرف مقابل مبنی بر عدم انجام تعهد از اساس فاقد وجاهت قانونی است؛ چرا که طبق بند ۳ قرارداد، پرداخت اقساط ثمن منوط به تحویل مبیع بوده که از انجام آن استنکاف ورزیده‌اند.\n۲. مطابق ماده ۲۱۹ قانون مدنی، عقودی که بر طبق قانون واقع شده باشد بین متعاملین و قائم‌مقام آنها لازم‌الاتباع است.\n۳. وجه التزام قراردادی طبق ماده ۲۳۰ قانون مدنی توسط طرفین معین شده و حاکم دادگاه نمی‌تواند متعهد را به بیشتر یا کمتر از آنچه تقویم شده محکوم نماید.\n\nبنا به مراتب یادشده، رد ادعای بی‌اساس خوانده و اصدار دادنامه شایسته مبنی بر محکومیت ایشان بر اساس خواسته تقدیمی مورد تمناست.`,
      };

    case 'dadkhast':
    default:
      return {
        formType: 'dadkhast',
        title: 'برگ دادخواست نخستین به دادگاه عمومی حقوقی',
        authorityName: 'دادگاه عمومی حقوقی مجتمع قضایی شهید بهشتی تهران',
        trackingCode: trackingNum,
        filingDate: dateStr,
        branchNumber: 'شعبه عمومی حقوقی دادگستری',
        claimant: {
          name: 'خواهان (نام و نام خانوادگی موکل)',
          fatherName: 'نام پدر',
          nationalId: 'کد ملی ده رقمی',
          job: 'کارشناس / فعال اقتصادی',
          address: 'تهران، نشانی اقامتگاه قانونی خواهان در سامانه ثنا',
          phone: '۰۹۱۲۰۰۰۰۰۰۰',
        },
        respondent: {
          name: 'خوانده (نام و نام خانوادگی متعهد / خریدار / فروشنده)',
          fatherName: 'نام پدر خوانده',
          nationalId: 'کد ملی خوانده',
          job: 'آزاد',
          address: 'تهران، نشانی محل اقامت یا اشتغال خوانده',
          phone: '۰۹۱۲-------',
        },
        attorney: {
          name: 'وکیل پایه یک دادگستری',
          licenseNumber: 'پروانه وکالت رسمی کانون وکلای دادگستری',
        },
        subject: 'الزام به ایفای تعهدات قراردادی، پرداخت اصل طلب به همراه خسارت تاخیر تادیه و کلیه خسارات دادرسی',
        evidences: [
          'تصویر مصدق سند رسمی / مبایعه‌نامه شماره ...',
          'تصویر فیش‌های واریزی و اسناد پرداخت ثمن',
          'گواهی عدم حضور صادره از دفترخانه اسناد رسمی شماره ...',
          'تصویر اظهارنامه رسمی ارسالی به شماره پیگیری ...',
        ],
        legalBasis: 'مواد ۱۰، ۲۱۹، ۲۲۰ و ۵۲۲ قانون مدنی و آیین دادرسی مدنی',
        bodyText: `ریاست محترم شعبه دادگاه عمومی حقوقی دادگستری\n\nبا سلام و تحیات وافره و با ادای احترام؛\nاحتراماً به وکالت از خواهان، معروض می‌دارد:\n\n۱. به موجب مبایعه‌نامه عادی / رسمی پیوست، خوانده محترم متعهد گردیده بودند که در تاریخ مشخص نسبت به انجام تعهدات قراردادی از جمله تحویل مبیع و تسویه حساب کامل اقدام نمایند.\n۲. علیرغم فرا رسیدن موعد مقرر و ارسال اظهارنامه رسمی قانونی و اعلام آمادگی کامل موکل، خوانده از انجام تعهدات قراردادی خودداری نموده است.\n۳. با عنایت به اصل صحت و لزوم قراردادها (اصاله اللزوم) و ماده ۱۰ و ۲۱۹ قانون مدنی، قراردادهای خصوصی معتبر و لازم‌الاتباع می‌باشند.\n\nعلی‌هذا با تقدیم این دادخواست مستنداً به مواد قانونی یادشده و مواد ۱۹۸ و ۵۱۹ قانون آیین دادرسی دادگاه‌های عمومی و انقلاب در امور مدنی، رسیدگی و صدور حکم شایسته بر محکومیت خوانده به شرح خواسته به انضمام کلیه خسارات دادرسی و حق‌الوکاله وکیل مورد استدعاست.`,
      };
  }
}

/**
 * Generates high-resolution, print-ready HTML for official judiciary document
 */
export function renderJudicialFormHTML(form: JudicialFormData): string {
  const claimant = form.claimant || {};
  const respondent = form.respondent || {};
  const attorney = form.attorney || {};
  const evidencesList = (form.evidences || [])
    .map((e, idx) => `<tr><td style="width: 30px; text-align: center; border: 1px solid #000; padding: 4px;">${idx + 1}</td><td style="border: 1px solid #000; padding: 4px;">${e}</td></tr>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>${form.title || 'برگ رسمی قضایی'}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm 12mm 15mm;
    }
    body {
      font-family: "IRANSans", "B Nazanin", "Tahoma", sans-serif;
      direction: rtl;
      background: #fff;
      color: #000;
      margin: 0;
      padding: 10px;
      font-size: 13px;
      line-height: 1.6;
    }
    .form-container {
      border: 3px double #1a365d;
      padding: 16px;
      position: relative;
      background: #ffffff;
      box-sizing: border-box;
      max-width: 800px;
      margin: 0 auto;
    }
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 55px;
      color: rgba(26, 54, 93, 0.04);
      font-weight: 900;
      pointer-events: none;
      z-index: 0;
      white-space: nowrap;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    .header-table td {
      vertical-align: middle;
    }
    .header-center {
      text-align: center;
    }
    .emblem-img {
      width: 55px;
      height: auto;
      margin-bottom: 4px;
    }
    .header-title {
      font-size: 17px;
      font-weight: bold;
      color: #1a365d;
      margin: 4px 0;
    }
    .header-subtitle {
      font-size: 12px;
      font-weight: normal;
      color: #333;
    }
    .info-box {
      font-size: 11px;
      line-height: 1.8;
      text-align: right;
    }
    .grid-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      border: 1px solid #1a365d;
      font-size: 12px;
    }
    .grid-table th, .grid-table td {
      border: 1px solid #1a365d;
      padding: 6px 8px;
      vertical-align: top;
    }
    .grid-table th {
      background-color: #f1f5f9;
      color: #1a365d;
      font-weight: bold;
      text-align: center;
      width: 13%;
    }
    .body-section {
      border: 1px solid #1a365d;
      padding: 12px 16px;
      min-height: 280px;
      margin-bottom: 12px;
      font-size: 13px;
      line-height: 1.8;
      text-align: justify;
      white-space: pre-wrap;
      background: #fafbfc;
    }
    .footer-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      font-size: 11px;
    }
    .footer-table td {
      border: 1px dashed #718096;
      padding: 10px;
      vertical-align: top;
      height: 70px;
    }
    .seal-box {
      text-align: center;
      color: #4a5568;
    }
    @media print {
      body {
        padding: 0;
        background: none;
      }
      .form-container {
        border: 2px solid #000;
        max-width: 100%;
        padding: 12px;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="form-container">
    <div class="watermark">قوه قضاییه جمهوری اسلامی ایران</div>

    <table class="header-table">
      <tr>
        <td style="width: 25%;" class="info-box">
          <div><strong>شماره پرونده:</strong> ${form.trackingCode || 'ثبت در سامانه'}</div>
          <div><strong>شماره بایگانی:</strong> ${form.branchNumber || 'شعبه صالحه'}</div>
          <div><strong>تاریخ تنظیم:</strong> ${form.filingDate || 'امروز'}</div>
          <div><strong>پیوست:</strong> دارد (تصاویر مصدق)</div>
        </td>
        <td style="width: 50%;" class="header-center">
          <div style="font-size: 11px; font-weight: bold; margin-bottom: 2px;">بسمه تعالی</div>
          <div style="font-size: 13px; font-weight: bold; color: #1a365d;">جمهوری اسلامی ایران</div>
          <div style="font-size: 11px; color: #4a5568; margin-bottom: 4px;">قوه قضاییه - دادگستری کل</div>
          <div class="header-title">${form.title || 'برگ رسمی قضایی'}</div>
          <div class="header-subtitle">مرجع رسیدگی‌کننده: <strong>${form.authorityName || 'مراجع صالح قضایی دادگستری'}</strong></div>
        </td>
        <td style="width: 25%; text-align: left;" class="info-box">
          <div style="border: 1px solid #1a365d; padding: 4px 6px; text-align: center; background: #f8fafc; border-radius: 4px;">
            <div style="font-size: 10px; font-weight: bold; color: #1a365d;">شناسه رهگیری ثنا / عدل‌ایران</div>
            <div style="font-family: monospace; font-size: 11px; direction: ltr; margin-top: 2px;">${form.trackingCode || '140598765432'}</div>
            <div style="font-size: 9px; color: #718096; margin-top: 2px;">سامانه خدمات الکترونیک قضایی</div>
          </div>
        </td>
      </tr>
    </table>

    <table class="grid-table">
      <tr>
        <th>خواهان / شاکی</th>
        <td colspan="3">
          <strong>${claimant.name || '-'}</strong> | نام پدر: ${claimant.fatherName || '-'} | کد ملی: ${claimant.nationalId || '-'} | شغل: ${claimant.job || '-'} | تلفن: ${claimant.phone || '-'}
          <br><strong>اقامتگاه قانونی:</strong> ${claimant.address || '-'}
        </td>
      </tr>
      <tr>
        <th>خوانده / مشتکی‌عنه</th>
        <td colspan="3">
          <strong>${respondent.name || '-'}</strong> | نام پدر: ${respondent.fatherName || '-'} | کد ملی: ${respondent.nationalId || '-'} | شغل: ${respondent.job || '-'}
          <br><strong>اقامتگاه:</strong> ${respondent.address || '-'}
        </td>
      </tr>
      <tr>
        <th>وکیل دادگستری</th>
        <td colspan="3">
          <strong>${attorney.name || 'وکیل پایه یک دادگستری'}</strong> | شماره پروانه وکالت: ${attorney.licenseNumber || 'معتبر رسمی'}
        </td>
      </tr>
      <tr>
        <th>تعیین خواسته / شکایت</th>
        <td colspan="3">
          <strong style="color: #1a365d;">${form.subject || '-'}</strong>
        </td>
      </tr>
      <tr>
        <th>دلایل و منضمات</th>
        <td colspan="3">
          <table style="width: 100%; border-collapse: collapse;">
            ${evidencesList}
          </table>
          ${form.legalBasis ? `<div style="margin-top: 6px; font-size: 11px; color: #2d3748;"><strong>مستندات قانونی:</strong> ${form.legalBasis}</div>` : ''}
        </td>
      </tr>
    </table>

    <div style="font-weight: bold; color: #1a365d; margin: 8px 0 4px 0; font-size: 13px;">
      شرح دادخواست / شکواییه / لایحه به قلم وکیل پایه یک دادگستری:
    </div>

    <div class="body-section">
${form.bodyText || 'متن دادخواست'}
    </div>

    <table class="footer-table">
      <tr>
        <td style="width: 33%;" class="seal-box">
          <strong>محل امضا و اثر انگشت</strong><br>
          خواهان / شاکی / وکیل دادگستری
          <div style="margin-top: 25px; font-size: 10px; color: #718096;">امضا و اثر انگشت الکترونیک</div>
        </td>
        <td style="width: 34%;" class="seal-box">
          <strong>محل گواهی و ابطال تمبر</strong><br>
          تمبر مالیاتی و هزینه‌های دادرسی
          <div style="margin-top: 25px; font-size: 10px; color: #718096;">پرداخت الکترونیک در سامانه ثنا</div>
        </td>
        <td style="width: 33%;" class="seal-box">
          <strong>دفتر خدمات الکترونیک قضایی</strong><br>
          تایید اصالت و ثبت در پایگاه عدل ایران
          <div style="margin-top: 25px; font-size: 10px; color: #718096;">کد دفتر: ۵۴۹۸ - ثبت شده</div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}

/**
 * Triggers file download for Word (.doc format HTML wrap)
 */
export function downloadJudicialDoc(form: JudicialFormData) {
  const htmlContent = renderJudicialFormHTML(form);
  const blob = new Blob(['\ufeff' + htmlContent], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${form.title.replace(/\s+/g, '_')}_${Date.now()}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Opens Print dialog with exact printable layout
 */
export function printJudicialForm(form: JudicialFormData) {
  const htmlContent = renderJudicialFormHTML(form);
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 500);
}
