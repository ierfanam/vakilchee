/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import * as d3 from 'd3';

export interface CaseTimelineStage {
  id: string;
  stepNumber: number;
  title: string;
  shortTitle: string;
  category: 'filing' | 'notice' | 'investigation' | 'court' | 'judgment' | 'appeal' | 'enforcement';
  status: 'completed' | 'in_progress' | 'upcoming';
  date?: string;
  authority: string;
  description: string;
  requiredAction?: string;
  legalDeadline?: string;
  relatedFormType?: string;
}

export interface LegalCase {
  id: string;
  title: string;
  caseNumber: string;
  branch: string;
  category: 'civil' | 'criminal' | 'labor' | 'administrative' | 'commercial';
  categoryTitle: string;
  statusText: string;
  claimant: string;
  respondent: string;
  subject: string;
  progressPercent: number;
  activeStageId: string;
  urgentNotice?: string;
  stages: CaseTimelineStage[];
  updatedAt: string;
}

const DEFAULT_LEGAL_CASES: LegalCase[] = [
  {
    id: 'case-1',
    title: 'مطالبه وجه چک صیادی و خسارت تأخیر تأدیه',
    caseNumber: '۱۴۰۵۹۱۱۰۰۰۲۳۴۵۸۱',
    branch: 'شعبه ۱۲ دادگاه عمومی حقوقی مجتمع قضایی شهید بهشتی',
    category: 'commercial',
    categoryTitle: 'اسناد تجاری و چک',
    statusText: 'صدور اجراییه و ابلاغ به محکوم‌علیه',
    claimant: 'عرفان رجبی (دارنده با حسن نیت)',
    respondent: 'شرکت پویندگان تجارت البرز (صادرکننده)',
    subject: 'مطالبه اصل مبلغ ۵۵۰,۰۰۰,۰۰۰ ریال وجه چک به انضمام کلیه خسارات تأخیر تأدیه قانونی بر مبنای شاخص تورم بانک مرکزی و هزینه‌های دادرسی',
    progressPercent: 88,
    activeStageId: 'c1-s7',
    urgentNotice: 'مهلت ۱۰ روزه تودیع محکوم‌به توسط محکوم‌علیه تا پایان هفته',
    updatedAt: '۱۴۰۵/۰۲/۲۸',
    stages: [
      {
        id: 'c1-s1',
        stepNumber: 1,
        title: 'مشاوره حقوقی، احراز اصالت چک و گواهی عدم پرداخت',
        shortTitle: 'احراز چک و گواهی',
        category: 'filing',
        status: 'completed',
        date: '۱۴۰۴/۱۱/۱۰',
        authority: 'بانک عامل / سامانه صیاد',
        description: 'بررسی ثبت و تایید چک در سامانه صیاد بانک مرکزی، اخذ گواهی عدم پرداخت رسمی ممهور به کد رهگیری با ذکر علت کسر موجودی.',
        requiredAction: 'تطبیق مطابقت امضای صاحب حساب و احراز مسدودی یا عدم موجودی کافی.',
        relatedFormType: 'dadkhast',
      },
      {
        id: 'c1-s2',
        stepNumber: 2,
        title: 'ارسال اظهارنامه رسمی اخطار به صادرکننده و ظهرنویس',
        shortTitle: 'اظهارنامه رسمی',
        category: 'notice',
        status: 'completed',
        date: '۱۴۰۴/۱۱/۱۸',
        authority: 'دفتر خدمات الکترونیک قضایی',
        description: 'ارسال اظهارنامه رسمی وفق ماده ۱۵۶ قانون آیین دادرسی مدنی جهت مطالبه وجه و اخطار پرداخت ظرف مهلت ۴۸ ساعت قبل از طرح دعوی.',
        requiredAction: 'ابلاغ قانونی اظهارنامه به اقامتگاه ثنای صادرکننده.',
        relatedFormType: 'ezharnameh',
      },
      {
        id: 'c1-s3',
        stepNumber: 3,
        title: 'درخواست صدور مستقیم اجراییه (ماده ۲۳ قانون صدور چک)',
        shortTitle: 'درخواست اجراییه',
        category: 'filing',
        status: 'completed',
        date: '۱۴۰۴/۱۲/۰۲',
        authority: 'دادگاه عمومی حقوقی',
        description: 'تقدیم تقاضای صدور برگ اجراییه بدون نیاز به دادرسی ماهوی بر اساس مقررات اصلاحی ماده ۲۳ قانون صدور چک.',
        requiredAction: 'بررسی توسط دادرس شعبه و احراز عدم مشروط بودن چک در متن سند.',
        relatedFormType: 'dadkhast',
      },
      {
        id: 'c1-s4',
        stepNumber: 4,
        title: 'بررسی قضایی و صدور دادنامه برگ اجراییه',
        shortTitle: 'صدور برگ اجراییه',
        category: 'judgment',
        status: 'completed',
        date: '۱۴۰۴/۱۲/۲۲',
        authority: 'شعبه ۱۲ دادگاه عمومی حقوقی',
        description: 'صدور برگ اجراییه دادگاه مشتمل بر اصل خواسته و حق‌الوکاله قانونی و ارجاع پرونده به واحد اجرای احکام مدنی.',
        requiredAction: 'ثبت شماره دادنامه و بارگذاری در سامانه ابلاغ الکترونیک ثنا.',
        relatedFormType: 'layehe',
      },
      {
        id: 'c1-s5',
        stepNumber: 5,
        title: 'ابلاغ اجراییه به محکوم‌علیه و اعطای مهلت ۱۰ روزه',
        shortTitle: 'ابلاغ به محکوم‌علیه',
        category: 'enforcement',
        status: 'completed',
        date: '۱۴۰۵/۰۱/۱۵',
        authority: 'اجرای احکام مدنی دادگستری',
        description: 'ابلاغ رسمی دادنامه اجراییه به مخاطب با قید مهلت ۱۰ روزه جهت پرداخت داوطلبانه یا معرفی اموال وفق ماده ۳۴ قانون اجرای احکام مدنی.',
        requiredAction: 'پیگیری وصول ابلاغیه در کارتابل ثنای مخاطب.',
        legalDeadline: 'مهلت ۱۰ روزه مقرر در ماده ۳۴ قانون اجرای احکام مدنی',
      },
      {
        id: 'c1-s6',
        stepNumber: 6,
        title: 'استعلام سه‌گانه اموال (حساب‌های بانکی، ثبت اسناد و راهور)',
        shortTitle: 'توقیف و استعلام اموال',
        category: 'enforcement',
        status: 'completed',
        date: '۱۴۰۵/۰۲/۰۴',
        authority: 'سامانه الکترونیک اجرای احکام مدنی',
        description: 'اخذ دستور قضایی توقیف پلاک ثبتی، حساب‌های بانکی متصل به شبا و وسایل نقلیه محکوم‌علیه از طریق سامانه‌های برخط دادگستری.',
        requiredAction: 'انسداد موجودی حساب بانکی متناظر تا سقف بدهی و خسارات قانونی.',
      },
      {
        id: 'c1-s7',
        stepNumber: 7,
        title: 'وصول وجه از محل حساب توقیفی و صدور دستور پرداخت',
        shortTitle: 'وصول و تسویه حساب',
        category: 'enforcement',
        status: 'in_progress',
        date: '۱۴۰۵/۰۲/۲۵',
        authority: 'واحد اجرای احکام مدنی دادگستری',
        description: 'انتقال وجوه توقیف‌شده از حساب‌های مسدودی به حساب سپرده دادگستری و محاسبه دقیق خسارت تأخیر روزشمار تا تاریخ وصول.',
        requiredAction: 'ارائه شماره شبای موکل جهت واریز خالص محکوم‌به و امضای فرم تسویه نهایی.',
        legalDeadline: 'اقدام ظرف حداکثر ۵ روز کاری',
        relatedFormType: 'nameh_edari',
      },
      {
        id: 'c1-s8',
        stepNumber: 8,
        title: 'مختومه شدن پرونده اجرایی و رفع انسداد مازاد اموال',
        shortTitle: 'مختومه شدن نهایی',
        category: 'enforcement',
        status: 'upcoming',
        date: 'پیش‌بینی: ۱۴۰۵/۰۳/۱۰',
        authority: 'دادگاه صادرکننده اجراییه',
        description: 'بایگانی قطعی پرونده پس از وصول کامل طلب و صدور دستور رفع اثر از تمامی توقیفات و سوابق تنبیهی محکوم‌علیه.',
        requiredAction: 'اخذ گواهی تسویه نهایی و آرشیو الکترونیک سند در بایگانی.',
      },
    ],
  },
  {
    id: 'case-2',
    title: 'الزام به تنظیم سند رسمی انتقال ملک، فک رهن و اخذ پایان‌کار',
    caseNumber: '۱۴۰۵۹۱۱۰۰۰۸۴۹۱۲۰',
    branch: 'شعبه ۵ دادگاه عمومی حقوقی تهران',
    category: 'civil',
    categoryTitle: 'املاک و اراضی',
    statusText: 'تعیین کارشناس رسمی دادگستری و ارزیابی مبیع',
    claimant: 'عرفان رجبی (خریدار مبایعه‌نامه)',
    respondent: 'آقای بهزاد میرزایی (فروشنده و سازنده)',
    subject: 'الزام خوانده به فک رهن از پلاک ثبتی، اخذ مفاصاحساب شهرداری و تامین اجتماعی، اخذ صورت‌مجلس تفکیکی و حضور در دفترخانه جهت انتقال سند رسمی با مطالبه روزانه وجه التزام قراردادی',
    progressPercent: 50,
    activeStageId: 'c2-s4',
    urgentNotice: 'واریز دستمزد کارشناس رسمی تا ۲ روز کاری آینده',
    updatedAt: '۱۴۰۵/۰۲/۲۶',
    stages: [
      {
        id: 'c2-s1',
        stepNumber: 1,
        title: 'بررسی مبایعه‌نامه و صدور گواهی عدم حضور در دفترخانه',
        shortTitle: 'گواهی عدم حضور',
        category: 'filing',
        status: 'completed',
        date: '۱۴۰۴/۰۹/۱۰',
        authority: 'دفترخانه اسناد رسمی شماره ۱۱۴',
        description: 'حضور خریدار در موعد مقرر قراردادی در دفترخانه همراه با الباقی ثمن معامله و صدور گواهی رسمی عدم حضور فروشنده.',
        requiredAction: 'پیوست کردن اصل گواهی عدم حضور و رسید آماده بودن چک ثمن معامله.',
        relatedFormType: 'dadkhast',
      },
      {
        id: 'c2-s2',
        stepNumber: 2,
        title: 'ثبت دادخواست بدوی حقوقی و قرار دستور موقت منع نقل‌وانتقال',
        shortTitle: 'ثبت دادخواست و دستور موقت',
        category: 'filing',
        status: 'completed',
        date: '۱۴۰۴/۱۰/۰۴',
        authority: 'دفاتر خدمات الکترونیک قضایی',
        description: 'ثبت دادخواست با خواسته الزام به تنظیم سند رسمی، اخذ پایان‌کار و صورت‌مجلس تفکیکی همراه با تقاضای صدور دستور موقت منع معامله بر روی پلاک ثبتی.',
        requiredAction: 'سپردن خسارت احتمالی موضوع دستور موقت در صندوق دادگستری.',
        relatedFormType: 'dadkhast',
      },
      {
        id: 'c2-s3',
        stepNumber: 3,
        title: 'جلسه نخست دادرسی و استعلام وضعیت ثبتی ملک از اداره ثبت',
        shortTitle: 'جلسه نخست و استعلام ثبتی',
        category: 'court',
        status: 'completed',
        date: '۱۴۰۴/۱۱/۲۰',
        authority: 'شعبه ۵ دادگاه عمومی حقوقی',
        description: 'تشکیل جلسه رسیدگی، استماع اظهارات طرفین و ارسال مکاتبه برخط به اداره ثبت اسناد جهت احراز مالکیت رسمی خوانده و بازداشت نبودن ملک.',
        requiredAction: 'تقدیم لایحه تکمیلی و استناد به مواد ۱۰، ۲۱۹ و ۲۲۱ قانون مدنی.',
        relatedFormType: 'layehe',
      },
      {
        id: 'c2-s4',
        stepNumber: 4,
        title: 'ارجاع امر به کارشناس رسمی دادگستری رشته راه و ساختمان',
        shortTitle: 'کارشناسی رسمی',
        category: 'investigation',
        status: 'in_progress',
        date: '۱۴۰۵/۰۲/۱۰',
        authority: 'کانون کارشناسان رسمی دادگستری',
        description: 'تعیین کارشناس جهت بازدید میدانی از آپارتمان، ارزیابی اتمام عملیات ساختمانی و بررسی موانع صدور پایان‌کار شهرداری.',
        requiredAction: 'تودیع دستمزد کارشناس رسمی دادگستری در فرجه قانونی ۷ روزه جهت جلوگیری از خروج پرونده از نوبت.',
        legalDeadline: 'مهلت واریز دستمزد: حداکثر تا ۲ روز کاری',
        relatedFormType: 'layehe',
      },
      {
        id: 'c2-s5',
        stepNumber: 5,
        title: 'ابلاغ نظریه کارشناسی و مهلت قانونی ثبت اعتراض',
        shortTitle: 'ابلاغ نظریه کارشناسی',
        category: 'investigation',
        status: 'upcoming',
        date: 'پیش‌بینی: ۱۴۰۵/۰۳/۰۵',
        authority: 'دفتر شعبه دادگاه',
        description: 'وصول گزارش کتبی کارشناس و ابلاغ آن به طرفین دعوی با اعطای مهلت یک‌هفته‌ای وفق ماده ۲۶۰ ق.آ.د.م جهت اعلام نظر یا اعتراض.',
        requiredAction: 'بررسی انطباق متراژ اعلامی کارشناس با توافقات قراردادی مبایعه‌نامه.',
        legalDeadline: 'مهلت اعتراض ۷ روز پس از تاریخ ابلاغ واقعی',
      },
      {
        id: 'c2-s6',
        stepNumber: 6,
        title: 'صدور دادنامه محکومیت خوانده به انتقال رسمی سند و وجه التزام',
        shortTitle: 'صدور رأی بدوی',
        category: 'judgment',
        status: 'upcoming',
        date: 'پیش‌بینی: ۱۴۰۵/۰۳/۲۵',
        authority: 'شعبه ۵ دادگاه حقوقی',
        description: 'انشای رأی قاطع دعوی مبنی بر محکومیت خوانده به فک رهن، اخذ صورت‌مجلس تفکیکی و حضور در دفترخانه همراه با پرداخت روزانه خسارت تأخیر.',
        requiredAction: 'پیگیری ابلاغ دادنامه و بررسی لزوم فرجام یا تمکین.',
      },
      {
        id: 'c2-s7',
        stepNumber: 7,
        title: 'انقضای مهلت ۲۰ روزه تجدیدنظرخواهی و قطعیت دادنامه',
        shortTitle: 'قطعیت دادنامه',
        category: 'appeal',
        status: 'upcoming',
        date: 'پیش‌بینی: ۱۴۰۵/۰۴/۲۰',
        authority: 'دادگاه تجدیدنظر استان تهران',
        description: 'گذشت مواعد قانونی اعتراض یا تایید دادنامه در محاکم تجدیدنظر و صدور گواهی قطعیت حکم.',
        legalDeadline: 'مهلت تجدیدنظرخواهی ۲۰ روز برای اشخاص مقیم ایران',
      },
      {
        id: 'c2-s8',
        stepNumber: 8,
        title: 'حضور نماینده دادگاه در دفترخانه جهت امضای سند انتقال',
        shortTitle: 'انتقال اجرایی سند',
        category: 'enforcement',
        status: 'upcoming',
        date: 'پیش‌بینی: ۱۴۰۵/۰۵/۱۵',
        authority: 'دفترخانه اسناد رسمی / اجرای احکام',
        description: 'در صورت استنکاف فروشنده از امضا، نماینده دادگاه شخصاً در دفترخانه حاضر و سند انتقال رسمی را به نام خریدار امضا می‌نماید (ماده ۱۴۵ قانون اجرای احکام).',
        requiredAction: 'اخذ رونوشت سند تک‌برگی مالکیت کاداستری به نام خریدار.',
      },
    ],
  },
  {
    id: 'case-3',
    title: 'دادخواست ابطال تصمیم اداری و برقراری حقوق مکتسبه در دیوان عدالت',
    caseNumber: '۱۴۰۵۹۱۱۰۰۰۴۱۲۰۷۸',
    branch: 'شعبه ۳ تجدیدنظر دیوان عدالت اداری',
    category: 'administrative',
    categoryTitle: 'دعاوی دیوان عدالت اداری',
    statusText: 'تبادل لوایح دفاعیه و منتظر انشای رأی نهایی',
    claimant: 'عرفان رجبی',
    respondent: 'سازمان امور اداری و استخدامی کشور / صندوق بازنشستگی',
    subject: 'ابطال بخشنامه مغایر با قانون مدیریت خدمات کشوری و الزام دستگاه به اصلاح احکام کارگزینی و پرداخت مابه‌التفاوت مزایای رفاهی',
    progressPercent: 75,
    activeStageId: 'c3-s6',
    urgentNotice: 'پرونده آماده اتخاذ تصمیم و صدور رأی قطعی دیوان عدالت است',
    updatedAt: '۱۴۰۵/۰۲/۲۷',
    stages: [
      {
        id: 'c3-s1',
        stepNumber: 1,
        title: 'ثبت دادخواست نخستین در سامaneh ساجد دیوان عدالت اداری',
        shortTitle: 'ثبت در سامانه ساجد',
        category: 'filing',
        status: 'completed',
        date: '۱۴۰۴/۰۷/۱۵',
        authority: 'دیوان عدالت اداری (سامانه ساجد)',
        description: 'تنظیم و ارسال الکترونیک دادخواست با استناد به اصول ۱۷۰ و ۱۷۳ قانون اساسی و قانون تشکیلات و آیین دادرسی دیوان عدالت اداری.',
        relatedFormType: 'divan',
      },
      {
        id: 'c3-s2',
        stepNumber: 2,
        title: 'ابلاغ دادخواست به دستگاه دولتی طرف شکایت جهت پاسخگویی',
        shortTitle: 'ابلاغ به طرف شکایت',
        category: 'court',
        status: 'completed',
        date: '۱۴۰۴/۰۸/۱۰',
        authority: 'دفتر شعبه بدوی دیوان',
        description: 'ارسال نسخه ثانی دادخواست و ضمائم به دستگاه خوانده با اعطای مهلت یک‌ماهه قانونی وفق ماده ۳۳ قانون دیوان جهت ارسال لایحه دفاعیه.',
        legalDeadline: 'مهلت قانونی ارسال پاسخ یک ماه از تاریخ ابلاغ',
      },
      {
        id: 'c3-s3',
        stepNumber: 3,
        title: 'وصول لایحه دفاعیه سازمان و ارسال پاسخ تکمیلی شاکی',
        shortTitle: 'تبادل لوایح دیوان',
        category: 'court',
        status: 'completed',
        date: '۱۴۰۴/۰۹/۲۸',
        authority: 'شعبه رسیدگی‌کننده',
        description: 'بررسی لوایح ارسالی طرف شکایت و تقدیم لایحه جوابیه مستدل با استناد به آرای وحدت رویه هیأت عمومی دیوان عدالت اداری.',
        relatedFormType: 'layehe',
      },
      {
        id: 'c3-s4',
        stepNumber: 4,
        title: 'صدور دادنامه بدوی مبنی بر ورود شکایت و الزام دستگاه',
        shortTitle: 'رأی شعبه بدوی دیوان',
        category: 'judgment',
        status: 'completed',
        date: '۱۴۰۴/۱۱/۰۵',
        authority: 'شعبه ۲۲ بدوی دیوان عدالت اداری',
        description: 'پذیرش استدلالات شاکی و صدور حکم به ابطال تصمیم اداری و اصلاح احکام کارگزینی با احتساب کلیه معوقات.',
      },
      {
        id: 'c3-s5',
        stepNumber: 5,
        title: 'تجدیدنظرخواهی دستگاه طرف شکایت و ارجاع به تجدیدنظر',
        shortTitle: 'تجدیدنظرخواهی طرفین',
        category: 'appeal',
        status: 'completed',
        date: '۱۴۰۴/۱۱/۲۸',
        authority: 'دفتر کل شعب تجدیدنظر دیوان',
        description: 'اعتراض دستگاه دولتی در مهلت بیست‌روزه و ارجاع پرونده به شعبه ۳ تجدیدنظر دیوان عدالت اداری.',
      },
      {
        id: 'c3-s6',
        stepNumber: 6,
        title: 'بررسی در شعبه تجدیدنظر دیوان و تبادل لوایح نهایی',
        shortTitle: 'بررسی تجدیدنظر دیوان',
        category: 'appeal',
        status: 'in_progress',
        date: '۱۴۰۵/۰۲/۱۵',
        authority: 'شعبه ۳ تجدیدنظر دیوان عدالت اداری',
        description: 'بررسی ماهوی پرونده توسط هیأت قضات شعبه تجدیدنظر و رد ایرادات شکلی دستگاه دولتی طرف شکایت.',
        requiredAction: 'پیگیری پرونده در کارتابل ساجد و منتظر انشای دادنامه قطعی.',
      },
      {
        id: 'c3-s7',
        stepNumber: 7,
        title: 'صدور دادنامه قطعی و ارسال به واحد اجرای احکام دیوان',
        shortTitle: 'دادنامه قطعی تجدیدنظر',
        category: 'judgment',
        status: 'upcoming',
        date: 'پیش‌بینی: ۱۴۰۵/۰۳/۱۵',
        authority: 'اجرای احکام دیوان عدالت اداری',
        description: 'تایید رأی بدوی، صدور دادنامه قطعی لازم‌الاجرا و ارجاع به اجرای احکام دیوان عدالت اداری.',
      },
      {
        id: 'c3-s8',
        stepNumber: 8,
        title: 'اعمال ماده ۱۱۰ قانون دیوان و استنکاف از اجرای حکم',
        shortTitle: 'اجرای حکم و ماده ۱۱۰',
        category: 'enforcement',
        status: 'upcoming',
        date: 'پیش‌بینی: ۱۴۰۵/۰۴/۰۱',
        authority: 'واحد اجرای احکام دیوان عدالت اداری',
        description: 'اخطار به بالاترین مقام دستگاه جهت اجرای حکم ظرف مهلت قانونی و تهدید به انفصال از خدمات دولتی در صورت استنکاف.',
        requiredAction: 'اخذ فیش واریز معوقات و فیش اصلاحی حقوق و بازنشستگی.',
      },
    ],
  },
  {
    id: 'case-4',
    title: 'مطالبه حق بیمه معوقه، سنوات و اضافه کاری در اداره تعاون، کار و رفاه',
    caseNumber: '۱۴۰۵۹۸۸۰۰۱۲۳۵۶',
    branch: 'هیأت حل اختلاف اداره تعاون، کار و رفاه اجتماعی',
    category: 'labor',
    categoryTitle: 'قانون کار و تامین اجتماعی',
    statusText: 'تعیین وقت جلسه دادرسی هیأت حل اختلاف',
    claimant: 'عرفان رجبی (کارگر خواهان)',
    respondent: 'شرکت مهندسی و ساختمانی آذرخش سازه',
    subject: 'مطالبه حق سنوات خدمت، مانده مرخصی، فوق‌العاده اضافه کاری، بن کارگری و الزام کارفرما به پرداخت حق بیمه معوقه مطابق ماده ۱۴۸ قانون کار',
    progressPercent: 62,
    activeStageId: 'c4-s5',
    urgentNotice: 'جلسه رسیدگی هیأت حل اختلاف در تاریخ ۱۴۰۵/۰۳/۰۴ ساعت ۱۰ صبح',
    updatedAt: '۱۴۰۵/۰۲/۲۴',
    stages: [
      {
        id: 'c4-s1',
        stepNumber: 1,
        title: 'جمع‌آوری ادله اثبات رابطه کارگری (پرینت حساب بانکی و ورود/خروج)',
        shortTitle: 'جمع‌آوری ادله اثباتی',
        category: 'investigation',
        status: 'completed',
        date: '۱۴۰۴/۱۰/۰۲',
        authority: 'شعبه بانکی و دفاتر کارگاه',
        description: 'اخذ گردش حساب واریزی حقوق توسط کارفرما، استشهاد محلی همکاران و اسناد الکترونیک تردد.',
      },
      {
        id: 'c4-s2',
        stepNumber: 2,
        title: 'ثبت دادخواست در سامانه جامع روابط کار (سامانه کارشناسی کارگر)',
        shortTitle: 'ثبت در سامانه جامع کار',
        category: 'filing',
        status: 'completed',
        date: '۱۴۰۴/۱۰/۲۰',
        authority: 'سامانه جامع روابط کار',
        description: 'احراز هویت در سامانه، تنظیم دقیق ردیف‌های مطالبات حقوقی و ماده ۱۴۸ قانون کار.',
        relatedFormType: 'darkhast_edari',
      },
      {
        id: 'c4-s3',
        stepNumber: 3,
        title: 'جلسه هیأت تشخیص اداره کار و بررسی اسناد و مدارک',
        shortTitle: 'هیأت تشخیص بدوی',
        category: 'court',
        status: 'completed',
        date: '۱۴۰۴/۱۱/۲۵',
        authority: 'هیأت تشخیص اداره کار',
        description: 'برگزاری جلسه با حضور طرفین، احراز رابطه مزدبگیری و سابقه کار بدون بیمه.',
      },
      {
        id: 'c4-s4',
        stepNumber: 4,
        title: 'صدور رأی هیأت تشخیص و اعتراض کارفرما به هیأت حل اختلاف',
        shortTitle: 'رأی تشخیص و تجدیدنظر',
        category: 'judgment',
        status: 'completed',
        date: '۱۴۰۴/۱۲/۱۸',
        authority: 'دبیرخانه هیأت‌های حل اختلاف',
        description: 'صدور رأی به نفع کارگر و ثبت اعتراض کارفرما در مهلت ۱۵ روزه قانونی.',
        legalDeadline: 'مهلت اعتراض به رأی تشخیص ۱۵ روز کاری است',
      },
      {
        id: 'c4-s5',
        stepNumber: 5,
        title: 'تعیین وقت دادرسی در هیأت حل اختلاف و ابلاغ تاریخ جلسه',
        shortTitle: 'وقت هیأت حل اختلاف',
        category: 'court',
        status: 'in_progress',
        date: '۱۴۰۵/۰۲/۱۸',
        authority: 'هیأت حل اختلاف اداره کار',
        description: 'تعیین وقت رسیدگی نهایی در تاریخ ۱۴۰۵/۰۳/۰۴ جهت صدور رأی قطعی و لازم‌الاجرا.',
        requiredAction: 'تنظیم لایحه دفاعیه نهایی و پاسخ به ایرادات کارفرما.',
        relatedFormType: 'layehe',
      },
      {
        id: 'c4-s6',
        stepNumber: 6,
        title: 'صدور رأی قطعی هیأت حل اختلاف اداره کار',
        shortTitle: 'رأی قطعی هیأت کار',
        category: 'judgment',
        status: 'upcoming',
        date: 'پیش‌بینی: ۱۴۰۵/۰۳/۱۰',
        authority: 'هیأت حل اختلاف اداره کار',
        description: 'انشای رأی قطعی مبنی بر محکومیت کارفرما به واریز سهم بیمه به تامین اجتماعی و پرداخت مطالبات ریالی.',
      },
      {
        id: 'c4-s7',
        stepNumber: 7,
        title: 'درخواست صدور اجراییه در دادگاه عمومی حقوقی',
        shortTitle: 'تقاضای اجراییه دادگاه',
        category: 'enforcement',
        status: 'upcoming',
        date: 'پیش‌بینی: ۱۴۰۵/۰۳/۲۵',
        authority: 'واحد اجرای احکام دادگستری',
        description: 'ارائه رأی قطعی هیأت حل اختلاف به دادگاه حقوقی جهت صدور برگ اجراییه وفق ماده ۱۶۶ قانون کار.',
        relatedFormType: 'dadkhast',
      },
      {
        id: 'c4-s8',
        stepNumber: 8,
        title: 'توقیف حساب کارفرما و واریز مطالبات به حساب کارگر',
        shortTitle: 'وصول و اجرای رأی',
        category: 'enforcement',
        status: 'upcoming',
        date: 'پیش‌بینی: ۱۴۰۵/۰۴/۱۵',
        authority: 'اجرای احکام مدنی دادگستری',
        description: 'توقیف حساب‌های شرکتی، واریز وجه و اعمال سابقه در شعبه تامین اجتماعی.',
      },
    ],
  },
];

@customElement('case-timeline-dashboard')
export class CaseTimelineDashboard extends LitElement {
  @property({ type: String })
  userId = '';

  @state()
  cases: LegalCase[] = [];

  @state()
  selectedCaseId = 'case-1';

  @state()
  selectedStageId = '';

  @state()
  activeFilter: 'all' | 'commercial' | 'civil' | 'administrative' | 'labor' = 'all';

  @state()
  isAddingCase = false;

  @state()
  newCaseTitle = '';

  @state()
  newCaseNumber = '';

  @state()
  newCaseBranch = '';

  @state()
  newCaseCategory: LegalCase['category'] = 'civil';

  @state()
  newCaseSubject = '';

  private resizeObserver: ResizeObserver | null = null;
  private timelineContainer: HTMLElement | null = null;

  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      direction: rtl;
      font-family: 'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #f1f5f9;
      box-sizing: border-box;
      user-select: none;
    }

    * {
      box-sizing: border-box;
    }

    /* Container Glass Card */
    .dashboard-wrapper {
      display: flex;
      flex-direction: column;
      height: 100%;
      max-height: 88vh;
      background: linear-gradient(165deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.92));
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 
        0 24px 60px rgba(0, 0, 0, 0.6),
        0 0 40px rgba(16, 185, 129, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }

    /* Top Dashboard Header */
    .dashboard-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(15, 23, 42, 0.6);
      flex-shrink: 0;
    }

    .header-branding {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-icon-badge {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: linear-gradient(135deg, #10b981, #0284c7);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
      color: #ffffff;
      flex-shrink: 0;
    }

    .header-titles {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .header-title {
      font-size: 16px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.2px;
    }

    .header-subtitle {
      font-size: 12px;
      color: #94a3b8;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .add-case-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 10px;
      background: linear-gradient(135deg, #0ea5e9, #2563eb);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #ffffff;
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(14, 165, 233, 0.3);
    }

    .add-case-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(14, 165, 233, 0.5);
      background: linear-gradient(135deg, #38bdf8, #3b82f6);
    }

    .close-widget-btn {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #94a3b8;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.18s ease;
    }

    .close-widget-btn:hover {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border-color: rgba(239, 68, 68, 0.3);
    }

    /* KPI Summary Row */
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      padding: 14px 24px;
      background: rgba(15, 23, 42, 0.4);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      flex-shrink: 0;
    }

    .kpi-card {
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      gap: 12px;
      transition: all 0.2s ease;
    }

    .kpi-card:hover {
      border-color: rgba(255, 255, 255, 0.18);
      background: rgba(30, 41, 59, 0.85);
    }

    .kpi-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 16px;
    }

    .kpi-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow: hidden;
    }

    .kpi-label {
      font-size: 11px;
      color: #94a3b8;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }

    .kpi-value {
      font-size: 15px;
      font-weight: 700;
      color: #f8fafc;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }

    /* Main Scrollable Body */
    .dashboard-body {
      flex: 1;
      overflow-y: auto;
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .dashboard-body::-webkit-scrollbar {
      width: 6px;
    }
    .dashboard-body::-webkit-scrollbar-track {
      background: rgba(15, 23, 42, 0.4);
    }
    .dashboard-body::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.18);
      border-radius: 4px;
    }

    /* Case Selector Pills and Filter Bar */
    .case-selector-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      overflow-x: auto;
      padding-bottom: 4px;
    }

    .case-selector-bar::-webkit-scrollbar {
      height: 4px;
    }
    .case-selector-bar::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.15);
      border-radius: 2px;
    }

    .case-tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 9px 16px;
      border-radius: 12px;
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #cbd5e1;
      font-size: 12.5px;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .case-tab-btn:hover {
      background: rgba(51, 65, 85, 0.8);
      color: #ffffff;
      border-color: rgba(255, 255, 255, 0.18);
    }

    .case-tab-btn.active {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(14, 165, 233, 0.25));
      border: 1px solid rgba(16, 185, 129, 0.5);
      color: #6ee7b7;
      font-weight: 700;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.15);
    }

    .tab-badge {
      padding: 2px 7px;
      border-radius: 10px;
      font-size: 10.5px;
      font-weight: 600;
      background: rgba(0, 0, 0, 0.25);
    }

    /* Active Case Info Banner */
    .case-hero-banner {
      background: linear-gradient(145deg, rgba(30, 41, 59, 0.75), rgba(15, 23, 42, 0.85));
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      position: relative;
      overflow: hidden;
    }

    .case-hero-banner::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 3px;
      background: linear-gradient(90deg, #10b981, #0ea5e9, #a855f7);
    }

    .case-hero-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }

    .case-hero-main {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
      min-width: 260px;
    }

    .case-category-tag {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      font-weight: 600;
      color: #38bdf8;
      background: rgba(14, 165, 233, 0.12);
      border: 1px solid rgba(14, 165, 233, 0.3);
      padding: 3px 9px;
      border-radius: 20px;
      width: fit-content;
    }

    .case-hero-title {
      font-size: 17px;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.4;
    }

    .case-hero-meta {
      display: flex;
      align-items: center;
      gap: 14px;
      font-size: 12px;
      color: #94a3b8;
      flex-wrap: wrap;
    }

    .meta-item {
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }

    .case-progress-box {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 6px;
      min-width: 140px;
    }

    .progress-percent-label {
      font-size: 20px;
      font-weight: 800;
      color: #34d399;
      display: flex;
      align-items: baseline;
      gap: 2px;
    }

    .progress-bar-outer {
      width: 100%;
      height: 7px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.1);
      overflow: hidden;
      position: relative;
    }

    .progress-bar-inner {
      height: 100%;
      border-radius: 10px;
      background: linear-gradient(90deg, #10b981, #0ea5e9);
      transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
    }

    .urgent-alert-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(245, 158, 11, 0.14);
      border: 1px solid rgba(245, 158, 11, 0.35);
      color: #fde68a;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
    }

    /* D3 Timeline Chart Container */
    .timeline-card {
      background: rgba(15, 23, 42, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      position: relative;
      box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    .timeline-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      padding-bottom: 10px;
    }

    .timeline-title {
      font-size: 14px;
      font-weight: 700;
      color: #e2e8f0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .timeline-legend {
      display: flex;
      align-items: center;
      gap: 14px;
      font-size: 11.5px;
      color: #94a3b8;
    }

    .legend-item {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .legend-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
    }

    .legend-dot.completed {
      background: #10b981;
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
    }

    .legend-dot.in-progress {
      background: #38bdf8;
      box-shadow: 0 0 10px rgba(56, 189, 248, 0.8);
      animation: pulseLegend 1.5s infinite;
    }

    .legend-dot.upcoming {
      background: #475569;
    }

    @keyframes pulseLegend {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.3); opacity: 0.6; }
    }

    .d3-chart-svg-container {
      width: 100%;
      height: 220px;
      position: relative;
      overflow-x: auto;
      overflow-y: hidden;
    }

    /* Selected Stage Detail Panel */
    .stage-detail-card {
      background: linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.85));
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 18px 22px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      transition: all 0.25s ease;
    }

    .stage-detail-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }

    .stage-badge-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .stage-number-badge {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: #0284c7;
      color: #ffffff;
      font-size: 13px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stage-title-text {
      font-size: 15.5px;
      font-weight: 700;
      color: #ffffff;
    }

    .stage-status-pill {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11.5px;
      font-weight: 600;
    }

    .stage-status-pill.completed {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #34d399;
    }

    .stage-status-pill.in_progress {
      background: rgba(56, 189, 248, 0.18);
      border: 1px solid rgba(56, 189, 248, 0.4);
      color: #38bdf8;
    }

    .stage-status-pill.upcoming {
      background: rgba(148, 163, 184, 0.12);
      border: 1px solid rgba(148, 163, 184, 0.25);
      color: #94a3b8;
    }

    .stage-desc-text {
      font-size: 13.5px;
      line-height: 1.7;
      color: #cbd5e1;
      background: rgba(15, 23, 42, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 12px 16px;
    }

    .stage-meta-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }

    .stage-meta-box {
      background: rgba(15, 23, 42, 0.45);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 10px;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .meta-box-label {
      font-size: 11px;
      color: #94a3b8;
    }

    .meta-box-val {
      font-size: 12.5px;
      font-weight: 600;
      color: #f1f5f9;
    }

    .stage-action-bar {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
      padding-top: 6px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }

    .stage-advance-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 10px;
      background: linear-gradient(135deg, #10b981, #059669);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #ffffff;
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
    }

    .stage-advance-btn:hover {
      background: linear-gradient(135deg, #34d399, #10b981);
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
    }

    .stage-form-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 10px;
      background: rgba(255, 215, 0, 0.12);
      border: 1px solid rgba(255, 215, 0, 0.35);
      color: #ffd700;
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .stage-form-btn:hover {
      background: rgba(255, 215, 0, 0.22);
      border-color: rgba(255, 215, 0, 0.6);
      transform: translateY(-1px);
    }

    /* Add Case Modal Sheet */
    .add-modal-overlay {
      position: absolute;
      inset: 0;
      background: rgba(15, 23, 42, 0.88);
      backdrop-filter: blur(16px);
      z-index: 50;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .add-modal-card {
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 16px;
      padding: 24px;
      width: 100%;
      max-width: 520px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
    }

    .input-field {
      width: 100%;
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 10px;
      padding: 10px 14px;
      color: #ffffff;
      font-size: 13px;
      font-family: inherit;
      outline: none;
      transition: border-color 0.2s;
    }

    .input-field:focus {
      border-color: #0ea5e9;
      box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.2);
    }

    @media (max-width: 768px) {
      .kpi-row {
        grid-template-columns: repeat(2, 1fr);
      }
      .stage-meta-grid {
        grid-template-columns: 1fr;
      }
      .dashboard-wrapper {
        border-radius: 0;
        max-height: 100vh;
      }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.loadCases();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  firstUpdated() {
    this.setupResizeObserver();
    this.renderD3Timeline();
  }

  updated(changedProps: Map<string, any>) {
    if (changedProps.has('selectedCaseId') || changedProps.has('selectedStageId') || changedProps.has('cases')) {
      this.renderD3Timeline();
    }
  }

  private loadCases() {
    try {
      const storageKey = `ai_lawyer_cases_${this.userId || 'default'}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        this.cases = JSON.parse(saved);
      } else {
        this.cases = DEFAULT_LEGAL_CASES;
        localStorage.setItem(storageKey, JSON.stringify(DEFAULT_LEGAL_CASES));
      }
    } catch {
      this.cases = DEFAULT_LEGAL_CASES;
    }

    if (this.cases.length > 0 && !this.selectedCaseId) {
      this.selectedCaseId = this.cases[0].id;
    }
    const currentCase = this.getActiveCase();
    if (currentCase && !this.selectedStageId) {
      this.selectedStageId = currentCase.activeStageId;
    }
  }

  private saveCases() {
    try {
      const storageKey = `ai_lawyer_cases_${this.userId || 'default'}`;
      localStorage.setItem(storageKey, JSON.stringify(this.cases));
    } catch (e) {
      console.warn('Error saving cases to localStorage:', e);
    }
  }

  private setupResizeObserver() {
    this.timelineContainer = this.renderRoot.querySelector('#d3ChartContainer');
    if (this.timelineContainer) {
      this.resizeObserver = new ResizeObserver(() => {
        this.renderD3Timeline();
      });
      this.resizeObserver.observe(this.timelineContainer);
    }
  }

  private getActiveCase(): LegalCase | undefined {
    return this.cases.find((c) => c.id === this.selectedCaseId) || this.cases[0];
  }

  private getActiveStage(): CaseTimelineStage | undefined {
    const curCase = this.getActiveCase();
    if (!curCase) return undefined;
    return curCase.stages.find((s) => s.id === this.selectedStageId) ||
           curCase.stages.find((s) => s.id === curCase.activeStageId) ||
           curCase.stages[0];
  }

  private renderD3Timeline() {
    const container = this.renderRoot.querySelector('#d3ChartContainer') as HTMLElement;
    if (!container) return;

    const activeCase = this.getActiveCase();
    if (!activeCase || !activeCase.stages || activeCase.stages.length === 0) return;

    // Clear previous SVG
    d3.select(container).selectAll('*').remove();

    const width = container.clientWidth || 750;
    const height = 210;
    const margin = { top: 40, right: 50, bottom: 45, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('overflow', 'visible')
      .style('direction', 'ltr'); // D3 coordinates handled strictly with RTL positions

    // Defs for Gradients and Glow Filters
    const defs = svg.append('defs');

    // Glow filter
    const filter = defs.append('filter').attr('id', 'glow-effect').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Linear progress gradient
    const progressGradient = defs.append('linearGradient').attr('id', 'progress-gradient').attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '0%');
    progressGradient.append('stop').attr('offset', '0%').attr('stop-color', '#10b981');
    progressGradient.append('stop').attr('offset', '50%').attr('stop-color', '#0ea5e9');
    progressGradient.append('stop').attr('offset', '100%').attr('stop-color', '#38bdf8');

    const stages = activeCase.stages;
    const stepCount = stages.length;

    // Map stages to horizontal coordinates:
    // In Persian RTL reading order, Step 1 starts at the RIGHT side and ends at the LEFT side
    const scaleX = d3
      .scalePoint<string>()
      .domain(stages.map((s) => s.id))
      .range([width - margin.right, margin.left])
      .padding(0.1);

    const centerY = margin.top + innerHeight / 2 - 5;

    // Draw background track line (all stages)
    svg
      .append('line')
      .attr('x1', margin.left)
      .attr('y1', centerY)
      .attr('x2', width - margin.right)
      .attr('y2', centerY)
      .attr('stroke', 'rgba(255, 255, 255, 0.12)')
      .attr('stroke-width', 4)
      .attr('stroke-dasharray', '6 4')
      .attr('stroke-linecap', 'round');

    // Calculate completed index
    const activeStageIndex = stages.findIndex((s) => s.id === activeCase.activeStageId);
    const validActiveIndex = activeStageIndex >= 0 ? activeStageIndex : 0;

    // Draw active progress path (from right to the active stage node)
    if (validActiveIndex >= 0) {
      const startX = width - margin.right;
      const endX = scaleX(stages[validActiveIndex].id) || margin.left;

      svg
        .append('line')
        .attr('x1', startX)
        .attr('y1', centerY)
        .attr('x2', endX)
        .attr('y2', centerY)
        .attr('stroke', 'url(#progress-gradient)')
        .attr('stroke-width', 5)
        .attr('stroke-linecap', 'round')
        .style('filter', 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))');
    }

    // Draw Nodes for each stage
    stages.forEach((stage, idx) => {
      const cx = scaleX(stage.id) || 0;
      const isSelected = stage.id === this.selectedStageId;
      const isCompleted = stage.status === 'completed';
      const isInProgress = stage.status === 'in_progress';

      const nodeGroup = svg
        .append('g')
        .attr('class', 'stage-node')
        .style('cursor', 'pointer')
        .on('click', () => {
          this.selectedStageId = stage.id;
        });

      // Pulse ring for in_progress node
      if (isInProgress) {
        nodeGroup
          .append('circle')
          .attr('cx', cx)
          .attr('cy', centerY)
          .attr('r', 18)
          .attr('fill', 'none')
          .attr('stroke', '#38bdf8')
          .attr('stroke-width', 2)
          .attr('opacity', 0.8)
          .style('animation', 'pulseLegend 1.8s infinite');
      }

      // Outer Selection Ring
      if (isSelected) {
        nodeGroup
          .append('circle')
          .attr('cx', cx)
          .attr('cy', centerY)
          .attr('r', 16)
          .attr('fill', 'none')
          .attr('stroke', '#ffd700')
          .attr('stroke-width', 2.5)
          .style('filter', 'drop-shadow(0 0 6px rgba(255, 215, 0, 0.8))');
      }

      // Base Circle Node
      const circleFill = isCompleted ? '#10b981' : isInProgress ? '#0284c7' : '#334155';
      const circleStroke = isCompleted ? '#34d399' : isInProgress ? '#38bdf8' : '#475569';

      nodeGroup
        .append('circle')
        .attr('cx', cx)
        .attr('cy', centerY)
        .attr('r', 12)
        .attr('fill', circleFill)
        .attr('stroke', circleStroke)
        .attr('stroke-width', 2)
        .style('transition', 'all 0.2s ease');

      // Inner icon or step number
      if (isCompleted) {
        // Checkmark path
        nodeGroup
          .append('path')
          .attr('d', `M ${cx - 4} ${centerY} L ${cx - 1} ${centerY + 3} L ${cx + 4} ${centerY - 3}`)
          .attr('fill', 'none')
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 2)
          .attr('stroke-linecap', 'round')
          .attr('stroke-linejoin', 'round');
      } else {
        // Step number text
        nodeGroup
          .append('text')
          .attr('x', cx)
          .attr('y', centerY + 3.5)
          .attr('text-anchor', 'middle')
          .attr('fill', '#ffffff')
          .attr('font-size', '10px')
          .attr('font-weight', '700')
          .attr('font-family', 'Vazirmatn, sans-serif')
          .text(stage.stepNumber);
      }

      // Step title label (alternating or staggered for maximum readability)
      const labelY = idx % 2 === 0 ? centerY - 24 : centerY + 28;

      nodeGroup
        .append('text')
        .attr('x', cx)
        .attr('y', labelY)
        .attr('text-anchor', 'middle')
        .attr('fill', isSelected ? '#ffd700' : isInProgress ? '#38bdf8' : isCompleted ? '#e2e8f0' : '#94a3b8')
        .attr('font-size', isSelected ? '11.5px' : '10.5px')
        .attr('font-weight', isSelected || isInProgress ? '700' : '500')
        .attr('font-family', 'Vazirmatn, sans-serif')
        .text(stage.shortTitle);

      // Date badge if completed or in-progress
      if (stage.date) {
        const dateY = idx % 2 === 0 ? labelY - 14 : labelY + 14;
        nodeGroup
          .append('text')
          .attr('x', cx)
          .attr('y', dateY)
          .attr('text-anchor', 'middle')
          .attr('fill', '#64748b')
          .attr('font-size', '9px')
          .attr('font-family', 'Vazirmatn, sans-serif')
          .text(stage.date);
      }
    });
  }

  private handleAdvanceStage() {
    const curCase = this.getActiveCase();
    if (!curCase) return;

    const stages = curCase.stages;
    const curIndex = stages.findIndex((s) => s.id === curCase.activeStageId);

    if (curIndex < stages.length - 1) {
      stages[curIndex].status = 'completed';
      const nextIndex = curIndex + 1;
      stages[nextIndex].status = 'in_progress';
      curCase.activeStageId = stages[nextIndex].id;
      this.selectedStageId = stages[nextIndex].id;

      // Recalculate percent
      const completedCount = stages.filter((s) => s.status === 'completed').length;
      curCase.progressPercent = Math.round((completedCount / stages.length) * 100);

      this.cases = [...this.cases];
      this.saveCases();
      this.requestUpdate();
    }
  }

  private handleOpenFormForStage(formType?: string) {
    const curCase = this.getActiveCase();
    const curStage = this.getActiveStage();
    this.dispatchEvent(
      new CustomEvent('open-form-studio-for-case', {
        detail: {
          formType: formType || curStage?.relatedFormType || 'layehe',
          caseTitle: curCase?.title,
          caseNumber: curCase?.caseNumber,
          branchNumber: curCase?.branch,
          claimantName: curCase?.claimant,
          respondentName: curCase?.respondent,
          stageTitle: curStage?.title,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleCreateCaseSubmit() {
    if (!this.newCaseTitle.trim()) return;

    const newId = 'case-' + Date.now();
    const newCase: LegalCase = {
      id: newId,
      title: this.newCaseTitle.trim(),
      caseNumber: this.newCaseNumber.trim() || '۱۴۰۵۹۱۱۰۰۰' + Math.floor(100000 + Math.random() * 900000),
      branch: this.newCaseBranch.trim() || 'دادگاه عمومی حقوقی',
      category: this.newCaseCategory,
      categoryTitle: this.newCaseCategory === 'commercial' ? 'اسناد تجاری' : this.newCaseCategory === 'criminal' ? 'دعاوی کیفری' : this.newCaseCategory === 'labor' ? 'قانون کار' : this.newCaseCategory === 'administrative' ? 'دیوان عدالت' : 'حقوقی و مدنی',
      statusText: 'تشکیل پرونده و شروع فرآیند دادرسی',
      claimant: 'عرفان رجبی',
      respondent: 'خوانده دعوی',
      subject: this.newCaseSubject.trim() || this.newCaseTitle.trim(),
      progressPercent: 12,
      activeStageId: `${newId}-s1`,
      updatedAt: new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()),
      stages: [
        {
          id: `${newId}-s1`,
          stepNumber: 1,
          title: 'بررسی مدارک و ادله اثباتی',
          shortTitle: 'بررسی مدارک',
          category: 'filing',
          status: 'in_progress',
          date: 'امروز',
          authority: 'دفتر خدمات الکترونیک قضایی',
          description: 'تنظیم شکواییه یا دادخواست حقوقی و پیوست کردن مستندات و ضمائم به سامانه ثنا.',
          requiredAction: 'بارگذاری اوراق شناسایی و وکالت‌نامه قضایی.',
        },
        {
          id: `${newId}-s2`,
          stepNumber: 2,
          title: 'ثبت دادخواست و ارجاع به شعبه دادگاه',
          shortTitle: 'ارجاع شعبه',
          category: 'filing',
          status: 'upcoming',
          authority: 'مجتمع قضایی صالحه',
          description: 'تخصیص شماره کلاسه بایگانی و تعیین شعبه رسیدگی‌کننده دادگستری.',
        },
        {
          id: `${newId}-s3`,
          stepNumber: 3,
          title: 'ابلاغ وقت رسیدگی و تبادل لوایح',
          shortTitle: 'ابلاغ وقت و لوایح',
          category: 'court',
          status: 'upcoming',
          authority: 'دفتر شعبه دادگاه',
          description: 'ارسال اخطاریه وقت دادرسی به اصحاب دعوی و تبادل لوایح دفاعیه.',
        },
        {
          id: `${newId}-s4`,
          stepNumber: 4,
          title: 'جلسه رسیدگی ماهوی و صدور دادنامه',
          shortTitle: 'جلسه و صدور رأی',
          category: 'judgment',
          status: 'upcoming',
          authority: 'دادگاه صادرکننده رأی',
          description: 'حضور در جلسه دادرسی و استماع دفاعیات و انشای رأی دادگاه.',
        },
        {
          id: `${newId}-s5`,
          stepNumber: 5,
          title: 'صدور اجراییه و اجرای احکام',
          shortTitle: 'اجرای احکام',
          category: 'enforcement',
          status: 'upcoming',
          authority: 'اجرای احکام مدنی',
          description: 'مختومه نمودن پرونده از طریق وصول محکوم‌به و اجرای رأی قطعی.',
        },
      ],
    };

    this.cases = [newCase, ...this.cases];
    this.selectedCaseId = newId;
    this.selectedStageId = `${newId}-s1`;
    this.isAddingCase = false;
    this.newCaseTitle = '';
    this.newCaseNumber = '';
    this.newCaseBranch = '';
    this.newCaseSubject = '';
    this.saveCases();
    this.requestUpdate();
  }

  render() {
    const activeCase = this.getActiveCase();
    const activeStage = this.getActiveStage();
    const totalCases = this.cases.length;
    const avgProgress = Math.round(
      this.cases.reduce((sum, c) => sum + c.progressPercent, 0) / (totalCases || 1)
    );
    const completedStagesCount = this.cases.reduce(
      (sum, c) => sum + c.stages.filter((s) => s.status === 'completed').length,
      0
    );

    return html`
      <div class="dashboard-wrapper">
        <!-- Top Dashboard Header -->
        <div class="dashboard-header">
          <div class="header-branding">
            <div class="header-icon-badge">
              <svg xmlns="http://www.w3.org/2000/svg" height="22" viewBox="0 -960 960 960" width="22" fill="currentColor">
                <path d="M280-280h80v-200h-80v200Zm160 0h80v-400h-80v400Zm160 0h80v-120h-80v120ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm0 0v-560 560Z"/>
              </svg>
            </div>
            <div class="header-titles">
              <div class="header-title">داشبورد رهگیری مسیر و پیشرفت پرونده‌های قضایی</div>
              <div class="header-subtitle">نمودار تعاملی D3 بر اساس گام‌های رسمی آیین دادرسی دادگستری</div>
            </div>
          </div>

          <div class="header-actions">
            <button
              class="add-case-btn"
              @click=${() => {
                this.isAddingCase = true;
              }}>
              <svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 -960 960 960" width="18" fill="currentColor">
                <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/>
              </svg>
              <span>ثبت پرونده جدید</span>
            </button>

            <button
              class="close-widget-btn"
              @click=${() => {
                this.dispatchEvent(new CustomEvent('close-timeline-dashboard', { bubbles: true, composed: true }));
              }}
              title="بستن پنجره">
              <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor">
                <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- KPI Metric Row -->
        <div class="kpi-row">
          <div class="kpi-card">
            <div class="kpi-icon" style="background: rgba(14, 165, 233, 0.2); color: #38bdf8;">
              🏛️
            </div>
            <div class="kpi-info">
              <span class="kpi-label">کل پرونده‌های فعال</span>
              <span class="kpi-value">${totalCases} پرونده حقوقی</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon" style="background: rgba(16, 185, 129, 0.2); color: #34d399;">
              📈
            </div>
            <div class="kpi-info">
              <span class="kpi-label">میانگین پیشرفت دادرسی</span>
              <span class="kpi-value">${avgProgress}٪ پیشرفت</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon" style="background: rgba(168, 85, 247, 0.2); color: #c084fc;">
              ⚖️
            </div>
            <div class="kpi-info">
              <span class="kpi-label">مراحل تکمیل‌شده قضایی</span>
              <span class="kpi-value">${completedStagesCount} مرحله قانونی</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon" style="background: rgba(245, 158, 11, 0.2); color: #fbbf24;">
              ⏳
            </div>
            <div class="kpi-info">
              <span class="kpi-label">وضعیت آخرین اقدام</span>
              <span class="kpi-value">${activeCase?.statusText.substring(0, 22) || 'در جریان'}...</span>
            </div>
          </div>
        </div>

        <!-- Scrollable Main Body -->
        <div class="dashboard-body">
          <!-- Case Tabs Selector -->
          <div class="case-selector-bar">
            ${this.cases.map(
              (c) => html`
                <button
                  class="case-tab-btn ${c.id === this.selectedCaseId ? 'active' : ''}"
                  @click=${() => {
                    this.selectedCaseId = c.id;
                    this.selectedStageId = c.activeStageId;
                  }}>
                  <span>${c.title}</span>
                  <span class="tab-badge">${c.progressPercent}٪</span>
                </button>
              `
            )}
          </div>

          <!-- Hero Details for Active Case -->
          ${activeCase
            ? html`
                <div class="case-hero-banner">
                  <div class="case-hero-top">
                    <div class="case-hero-main">
                      <div class="case-category-tag">
                        <span>🏷️</span>
                        <span>${activeCase.categoryTitle}</span>
                      </div>
                      <div class="case-hero-title">${activeCase.title}</div>
                      <div class="case-hero-meta">
                        <span class="meta-item">
                          <strong>شماره پرونده / کلاسه:</strong>
                          <span>${activeCase.caseNumber}</span>
                        </span>
                        <span class="meta-item">
                          <strong>مرجع رسیدگی:</strong>
                          <span>${activeCase.branch}</span>
                        </span>
                        <span class="meta-item">
                          <strong>طرفین دعوی:</strong>
                          <span>${activeCase.claimant} علیه ${activeCase.respondent}</span>
                        </span>
                      </div>
                    </div>

                    <div class="case-progress-box">
                      <div class="progress-percent-label">
                        <span>${activeCase.progressPercent}</span>
                        <span style="font-size: 14px;">٪</span>
                      </div>
                      <div class="progress-bar-outer">
                        <div class="progress-bar-inner" style="width: ${activeCase.progressPercent}%;"></div>
                      </div>
                      <span style="font-size: 11px; color: #94a3b8;">پیشرفت کل فرآیند قضایی</span>
                    </div>
                  </div>

                  ${activeCase.urgentNotice
                    ? html`
                        <div class="urgent-alert-pill">
                          <span>⚠️</span>
                          <span><strong>اخطار موعد قانونی:</strong> ${activeCase.urgentNotice}</span>
                        </div>
                      `
                    : ''}
                </div>
              `
            : ''}

          <!-- D3 Interactive Timeline Graph Card -->
          <div class="timeline-card">
            <div class="timeline-header">
              <div class="timeline-title">
                <svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 -960 960 960" width="18" fill="#38bdf8">
                  <path d="M120-120v-80l80-80v-440h120v440l80 80v80H120Zm360 0v-80l80-80v-560h120v560l80 80v80H480Z"/>
                </svg>
                <span>مسیر گرافیکی گام‌های دادرسی و وضعیت رسیدگی (D3 Visualization)</span>
              </div>
              <div class="timeline-legend">
                <span class="legend-item">
                  <span class="legend-dot completed"></span>
                  <span>سپری‌شده (تکمیل)</span>
                </span>
                <span class="legend-item">
                  <span class="legend-dot in-progress"></span>
                  <span>گام جاری (در حال اقدام)</span>
                </span>
                <span class="legend-item">
                  <span class="legend-dot upcoming"></span>
                  <span>مراحل آتی</span>
                </span>
              </div>
            </div>

            <!-- SVG Render Hook for D3 -->
            <div class="d3-chart-svg-container" id="d3ChartContainer"></div>
          </div>

          <!-- Selected Stage Detail & Actions -->
          ${activeStage
            ? html`
                <div class="stage-detail-card">
                  <div class="stage-detail-top">
                    <div class="stage-badge-group">
                      <div class="stage-number-badge">${activeStage.stepNumber}</div>
                      <div class="stage-title-text">${activeStage.title}</div>
                    </div>

                    <div class="stage-status-pill ${activeStage.status}">
                      ${activeStage.status === 'completed'
                        ? '✅ سپری‌شده و ثبت در سامانه'
                        : activeStage.status === 'in_progress'
                        ? '⏳ مرحله در حال اقدام و پیگیری'
                        : '⏱️ در انتظار فرا رسیدن نوبت'}
                    </div>
                  </div>

                  <div class="stage-desc-text">
                    ${activeStage.description}
                  </div>

                  <div class="stage-meta-grid">
                    <div class="stage-meta-box">
                      <span class="meta-box-label">مرجع رسیدگی / اقدام‌کننده</span>
                      <span class="meta-box-val">${activeStage.authority}</span>
                    </div>

                    <div class="stage-meta-box">
                      <span class="meta-box-label">مهلت قانونی اقدام</span>
                      <span class="meta-box-val">${activeStage.legalDeadline || 'مطابق مواعد آیین دادرسی'}</span>
                    </div>

                    <div class="stage-meta-box">
                      <span class="meta-box-label">اقدام لازم موکل / وکیل</span>
                      <span class="meta-box-val" style="color: #67e8f9;">${activeStage.requiredAction || 'حضور در جلسه یا ثبت لایحه'}</span>
                    </div>
                  </div>

                  <div class="stage-action-bar">
                    <button
                      class="stage-form-btn"
                      @click=${() => this.handleOpenFormForStage(activeStage.relatedFormType)}
                      title="تنظیم اوراق یا لوایح مربوط به این مرحله">
                      <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 -960 960 960" width="16" fill="currentColor">
                        <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h357l-80 80H200v560h560v-278l80-80v358q0 33-23.5 56.5T760-120H200Zm280-360ZM360-360v-170l367-367q12-12 27-18t30-6q16 0 30.5 6t26.5 18l56 57q11 12 17 26.5t6 29.5q0 15-5.5 29.5T897-728L530-360H360Zm480-424-56-56 56 56ZM440-440h56l224-224-28-28-29-28-223 224v56Zm252-252-29-28 29 28 28 28-28-28Z"/>
                      </svg>
                      <span>تنظیم لایحه یا فرم این مرحله ✍️</span>
                    </button>

                    ${activeStage.status === 'in_progress'
                      ? html`
                          <button
                            class="stage-advance-btn"
                            @click=${this.handleAdvanceStage}
                            title="تکمیل این مرحله و پیشروی به گام بعدی">
                            <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 -960 960 960" width="16" fill="currentColor">
                              <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/>
                            </svg>
                            <span>ثبت تکمیل این مرحله و رفتن به گام بعد ➡️</span>
                          </button>
                        `
                      : ''}
                  </div>
                </div>
              `
            : ''}
        </div>

        <!-- Add New Case Dialog Overlay -->
        ${this.isAddingCase
          ? html`
              <div
                class="add-modal-overlay"
                @click=${() => {
                  this.isAddingCase = false;
                }}>
                <div class="add-modal-card" @click=${(e: Event) => e.stopPropagation()}>
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-size: 16px; font-weight: 700; color: #ffffff;">ثبت پرونده قضایی جدید در مسیر دادرسی</div>
                    <button
                      class="close-widget-btn"
                      @click=${() => {
                        this.isAddingCase = false;
                      }}>
                      ✕
                    </button>
                  </div>

                  <div style="display: flex; flex-direction: column; gap: 8px;">
                    <label style="font-size: 12px; color: #94a3b8;">عنوان پرونده و خواسته:</label>
                    <input
                      type="text"
                      class="input-field"
                      placeholder="مثال: مطالبه خسارت تأخیر تأدیه یا خلع ید"
                      .value=${this.newCaseTitle}
                      @input=${(e: any) => {
                        this.newCaseTitle = e.target.value;
                      }}
                    />
                  </div>

                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                      <label style="font-size: 12px; color: #94a3b8;">شماره پرونده / کلاسه بایگانی:</label>
                      <input
                        type="text"
                        class="input-field"
                        placeholder="۱۶ رقمی ثنا یا شماره شعبه"
                        .value=${this.newCaseNumber}
                        @input=${(e: any) => {
                          this.newCaseNumber = e.target.value;
                        }}
                      />
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 8px;">
                      <label style="font-size: 12px; color: #94a3b8;">دسته‌بندی موضوعی:</label>
                      <select
                        class="input-field"
                        .value=${this.newCaseCategory}
                        @change=${(e: any) => {
                          this.newCaseCategory = e.target.value;
                        }}>
                        <option value="civil">حقوقی، مدنی و املاک</option>
                        <option value="commercial">اسناد تجاری، چک و سفته</option>
                        <option value="criminal">کیفری و جرایم مالی</option>
                        <option value="labor">کار و تامین اجتماعی</option>
                        <option value="administrative">دیوان عدالت اداری</option>
                      </select>
                    </div>
                  </div>

                  <div style="display: flex; flex-direction: column; gap: 8px;">
                    <label style="font-size: 12px; color: #94a3b8;">مرجع رسیدگی و شعبه:</label>
                    <input
                      type="text"
                      class="input-field"
                      placeholder="مثال: شعبه ۱۰ دادگاه عمومی حقوقی تهران"
                      .value=${this.newCaseBranch}
                      @input=${(e: any) => {
                        this.newCaseBranch = e.target.value;
                      }}
                    />
                  </div>

                  <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
                    <button
                      class="case-tab-btn"
                      @click=${() => {
                        this.isAddingCase = false;
                      }}>
                      انصراف
                    </button>
                    <button class="add-case-btn" @click=${this.handleCreateCaseSubmit}>
                      ثبت و رسم مسیر پرونده 🚀
                    </button>
                  </div>
                </div>
              </div>
            `
          : ''}
      </div>
    `;
  }
}
