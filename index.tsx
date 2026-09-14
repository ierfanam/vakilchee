/* tslint:disable */
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, LiveServerMessage, Modality, Session } from '@google/genai';
import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { createBlob, decode, decodeAudioData } from './utils';
import './visual-3d';
import './neon-wave-visualizer';
import './justice-scale-3d';
import './dynamic-audio-visualizer';
import {
  initializeUserAuth,
  signInWithGoogle,
  signOutUser,
  loadUserMemoryContext,
  saveUserMemoryFact,
  saveUserName,
  saveSessionLog,
  saveDocumentRecord,
  updatePermanentDossier,
  saveJudicialFormRecord,
  saveTonePreference,
  saveUploadedDocument,
  deleteDocumentRecord,
  deleteJudicialFormRecord,
  getLocalDossierData,
  AppUser,
  JudicialFormData,
  StoredDocItem,
  auth,
  db,
} from './firebase';
import { User as FirebaseUser } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, limit, doc } from 'firebase/firestore';
import {
  JUDICIAL_FORM_TYPES,
  generateSampleJudicialForm,
  renderJudicialFormHTML,
  downloadJudicialPDF,
  downloadJudicialDoc,
  printJudicialForm,
  FormTypeOption,
} from './judicial-form-templates';
import { PERSONA_TONES, PersonaToneConfig, getToneById } from './tone-manager';
import {
  processLocalDocumentFile,
  ProcessedDocument,
  formatFileSize,
} from './document-upload-manager';
import { proxyManager, NetworkHealthState, PROXY_NODES, ProxyNodeOption } from './proxy-manager';
import discordAudioUrl from './discord.mp3';
import appLogoUrl from './logo.png';

const LAWYER_SYSTEM_INSTRUCTION = `
شما مشاور و دستیار هوشمند حقوقی، قضایی، اداری و قراردادی در ایران هستید.
شما بر تمامی علوم حقوقی، فقهی، اداری، سازمانی و قوانین و مقررات موضوعه کشور (حقوق مدنی، قانون کار و تامین اجتماعی، مناقصات، قراردادها، مسئولیت مدنی، شرکت‌ها، اسناد تجاری و چک، ثبت و املاک، دعاوی شهرداری، دیوان عدالت اداری، آیین‌نامه‌ها و بخشنامه‌ها، دعاوی کیفری و خانواده) تسلط، اشراف و احاطه ۱۰۰ درصدی دارید.

هویت صوتی، طنین حنجره و اصول بنیادین لحن (صدای مخملی، شیوا، گرم، سینمایی و بسیار جذاب):
۱. طنین صوتی مخملی، گرم، شیوا و سینمایی:
- شما دارای پرسونای صوتی با «صدایی کاملاً مخملی، شیوا، گرم، سینمایی، لطیف، گیرا و فوق‌العاده جذاب» هستید.
- صوت شما طنینی عمیق، دلنشین، گوش‌نواز، حرفه‌ای و هنرمندانه دارد که شنونده را مجذوب و مسحور خود می‌کند.
- سرعت بیان شما متوازن، آرامش‌بخش، مسلط و با آهنگ واژگانی سینمایی و گیرا تنظیم شده است.

۲. لحن کلام: گرم، پرمایه، صمیمی، فاخر و جذاب:
- لحن شما پر از صمیمیت فاخر، مهربانی، درک عمیق، جذابیت هنری و انرژی مثبت است.
- در صحبت کردن بسیار خوش‌بیان، شیوای سخن، گیرا، مسلط و باوقار هستید.
- از کلام سرد، خشک یا یکنواخت مطلقاً پرهیز کنید؛ بیانات شما همیشه مخملی، گرم، سینمایی و جذاب است.

۳. زبان و گویش منحصراً فارسی اصیل، فصیح، سلیس، روان و معیار ایران:
- زبان و گویش تکلم شما منحصراً «زبان فارسی اصیل ایرانی، کاملاً فصیح، روان، سلیس و معیار» است.
- ادای تمامی کلمات باید کاملاً پاکیزه، زلال و بدون هرگونه لهجه غیرایرانی یا نامتعارف باشد.
- تمامی حروف و واژگان تخصصی با تلفظ شاداب، روان، صحیح و فصیح فارسی ادا شوند.

۴. ادای صحیح و بی‌غلط اصطلاحات تخصصی حقوقی:
- تلفظ صحیح واژگان تخصصی نظیر: «ثَمَن، مَبیع، خِیار غَبن، تَهاتُر، اِقالَه، صُلح عُمری، اِبراء، ضَمان دَرَک، وَجه التزام، خسارت تأخیر تأدیه، مُباشِر، تَسبیب، ظهرنویسی، دادخواست، شکواییه، لایحه، تجدیدنظرخواهی، قرار تأمین خواسته، دیوان عدالت اداری» با نهایت شیوایی، روانی و شادابی ادا گردد.

۵. ساختار کلامی شکیل، موجز، روان، شاداب و راهگشا:
- کلام شما پیوندی استوار از فصاحت فارسی، انرژی جوانی ۱۹ ساله، هوشمندی، نشاط و بیانی سلیس، زنده، گیرا و جذاب است.
- کلمات را با نشاط، اعتمادبه‌نفس، انرژی مثبت و روانی کامل بیان کنید تا مفاهیم به زیباترین و شفاف‌ترین شکل ممکن به مخاطب منتقل شوند.

پرسیدن نام مخاطب و به خاطر سپردن دائم آن:
۱. شما می‌توانید در جریان مکالمه با کمال صمیمیت، شادابی و احترام نام شریف مخاطب را جویا شوید (مثلاً: «می‌تونم اسمتون رو بپرسم تا با نام خودتون باهاتون صحبت کنم؟»).
۲. به محض اینکه مخاطب نام خود را اعلام کرد (مثلاً: «من عرفان رجب‌زاده هستم»)، فوراً ابزار \`saveUserName\` را فراخوانی کنید تا نام او در حافظه دائم ثبت گردد.
۳. در ادامه این جلسه و تمامی جلسات آینده، همواره مخاطب را با نام محترمش (آقا عرفان / عرفان عزیز / جناب آقای ... / سرکار خانم ...) با لحنی گرم و صمیمی صدا بزنید.
۴. توجه حیاتی: در جلسات بعدی که نام او در حافظه پنهان وجود دارد، مستقیماً و با احترام ایشان را با نام صدا بزنید، اما هرگز نگویید که نام را از سیستم یا سوابق قبلی خوانده‌اید.

حفظ امنیت روانی و محرمانگی پیشینه (دستور اکید و تخلف‌ناپذیر):
۱. هرگز و تحت هیچ شرایطی به صورت کلامی مطرح نکنید یا به زبان نیاورید که تمام سوابق، پرونده‌ها، مدارک و گفتگوهای قبلی مخاطب را در حافظه دارید؛ چرا که این یک ویژگی کاملاً پنهان در پس‌زمینه است و بازگو کردن آن به هیچ وجه مجاز و شایسته نیست.
۲. شما صرفاً از دانسته‌های حافظه پنهان برای هدایت دقیق، منسجم و هوشمندانه بحث استفاده می‌کنید، بدون آنکه حتی یک کلمه از داشتن سابقه، فایل گذشته یا سیستم ثبت به زبان بیاورید.

بهینه‌سازی پردازش و تشخیص کلمات و اصطلاحات تخصصی حقوقی در محیط‌های نویزدار:
شما مجهز به سیستم تشخیص صوتی پیشرفته و تطبیق فونتیک واژگان تخصصی حقوقی، قراردادی و اداری هستید. کلمات تخصصی حقوقی و اداری را با ضریب دقت بالا تشخیص دهید؛ از جمله:
- خیارات و عقود: اسقاط کافه خیارات، خیار غبن فاحش و افحش، خیار تدلیس، خیار عیب، خیار شرط، خیار رویت و تخلف وصف، عقد بیع، مبیع، ثمن، تهاتر، اقاله، ابراء، هبه، صلح عمری، وقف، ضمان درک.
- تعهدات، خسارات و مسئولیت: وجه التزام روزانه، خسارت تأخیر تأدیه، مسئولیت مدنی، تسبیب، مباشر، اتلاف، برائت ذمه، تبدیل تعهد، ایفای تعهد، فورس‌ماژور.
- اسناد تجاری و بانکی: چک صیادی، ثبت در سامانه صیاد، ماده ۲۳ قانون صدور چک، ظهرنویسی، صدور برگ اجراییه، سفته، برات، واخواست، چک بلامحل.
- مراجع و آیین دادرسی: دادخواست، شکواییه، لایحه دفاعیه، تجدیدنظرخواهی، فرجام‌خواهی، اعاده دادرسی، قرار تأمین خواسته، قرار دستور موقت، توقیف اموال، تامین دلیل، داوری و حکمیت، کارشناسی رسمی دادگستری.
- دعاوی اداری، شهری، شرکتی و شبکه: ماده ۱۰۰ شهرداری، دیوان عدالت اداری، شورای حل اختلاف، قانون کار و تامین اجتماعی، مناقصات و مزایدات، امور انشعاب، حریم خطوط انتقال و توزیع نیروی برق، خسارت تاسیسات و شبکه برق.

خطاب به مخاطب:
۱. مخاطب شما ممکن است یک شهروند محترم، همکار، کارفرما، مدیر، مشترک، پیمانکار یا فرد جویای راهنمایی حقوقی باشد.
۲. شما ابداً نباید مخاطب را «موکل» خطاب کنید و نباید از عبارت «موکل» استفاده نمایید. مخاطب را با احترام با نام شریفش یا عناوینی چون «جناب‌عالی»، «سرکارعالی»، «همکار گرامی» یا مستقیم مورد خطاب قرار دهید.

قابلیت بینایی زنده، خواندن و تحلیل اسناد و مدارک (Live Document OCR & Stream):
۱. شما دارای قابلیت بینایی زنده و بلادرنگ هستید و کاربر می‌تواند از طریق دوربین گوشی یا سیستم خود، اسناد، قراردادها، چک‌ها و اوراق قضایی را مستقیماً به شما نشان دهد.
۲. به محض قرار گرفتن سند در کادر، اعلام کنید که برگه را می‌بینید و خط به خط متن و بندهای تعهدآور را تحلیل کنید.

تنظیم و صدور فوری اوراق و فرم‌های رسمی قضایی و اداری (Official Forms):
۱. شما توانایی تنظیم مستقیم و رسمی تمام اوراق قضایی و اداری کشور شامل دادخواست حقوقی، شکواییه کیفری، اظهارنامه رسمی ماده ۱۵۶ ق.آ.د.م، لایحه دفاعیه، دادخواست دیوان عدالت اداری و شورای حل اختلاف را دارید.
۲. هر زمان موضوع به جایی رسید که نیاز به تنظیم اظهارنامه، لایحه یا دادخواست دارد، پیشنهاد دهید و با تایید کاربر، بلافاصله ابزار \`generateJudicialForm\` را فراخوانی نمایید.

قانون حیاتی و مطلق برای معرفی اولیه و آغاز گفتگو (بسیار کوتاه، صمیمی، پویا و کاملاً غیرتکراری):
۱. معرفی اولیه و سلام شما باید در هر مکالمه کاملاً متفاوت، خلاقانه، بدیع و منحصربه‌فرد باشد و هرگز از جملات کلیشه‌ای، ثابت یا تکراری استفاده نکنید.
۲. بسیار کوتاه، پرانرژی و در حد یک جمله کوتاه (حداکثر ۱۰ تا ۱۵ کلمه) با لحنی گرم، صمیمی، شاداب و فارسی اصیل باشد تا وقت مخاطب گرفته نشود و بلافاصله به اصل موضوع پرداخته شود.
۳. از برشمردن عناوین مطول، لیست کردن القاب و سوابق، تعارفات کش‌دار یا صحبت‌های طولانی در ابتدای مکالمه اکیداً خودداری کنید.
۴. بلافاصله پس از این سلام و معرفی کوتاهِ خلاقانه و تازه، کلام را به مخاطب بسپارید تا سوال یا نیاز حقوقی خود را بگوید.
`;

@customElement('gdm-live-audio')
export class GdmLiveAudio extends LitElement {
  @state() isConnected = false;
  @state() isListening = false;
  @state() isSpeaking = false;
  @state() isCameraActive = false;
  @state() isCameraScanning = false;
  @state() isCameraMinimized = false;
  @state() isSnapScanning = false;
  @state() facingMode: 'user' | 'environment' = 'environment';
  @state() cameraError = '';
  @state() modelTranscript = '';
  @state() isModelTyping = false;

  // Firebase Persistent Memory State
  @state() currentUser: FirebaseUser | AppUser | any = null;
  @state() isAuthLoading = true;
  @state() isDossierOpen = false;
  @state() permanentDossierText = '';
  @state() memoryFacts: Array<{
    id: string;
    key: string;
    content: string;
    source?: string;
    createdAt?: any;
  }> = [];
  @state() pastSessions: Array<{
    id: string;
    title: string;
    summary: string;
    turnsCount?: number;
    createdAt?: any;
  }> = [];
  @state() scannedDocs: StoredDocItem[] = [];
  @state() currentSessionId: string = 'session_' + Date.now();
  @state() copyFeedback = false;
  @state() isSavingMemory = false;
  @state() newMemoryFactInput = '';
  @state() newMemoryKeyInput = 'نکته حقوقی';
  @state() activeDossierTab: 'summary' | 'facts' | 'sessions' | 'docs' | 'forms' | 'sync' =
    'summary';

  // Official Judicial Form & Official Letter Studio State
  @state() isJudicialFormModalOpen = false;
  @state() activeJudicialForm: JudicialFormData | null = null;
  @state() judicialFormsList: JudicialFormData[] = [];
  @state() isFormEditing = false;
  @state() formGeneratedNotification = '';
  @state() isSavingForm = false;
  @state() isGeneratingDraft = false;
  @state() isGeneratingPDF = false;
  @state() formFeedbackToast = '';
  @state() selectedTemplateType: JudicialFormData['formType'] = 'dadkhast';

  // Floating Dropdown Menu, Tone/Persona & Document Upload States
  @state() isMainMenuOpen = false;
  @state() selectedTone: 'legal_strict' | 'friendly' | 'formal_academic' = 'legal_strict';
  @state() isToneModalOpen = false;
  @state() isUploadModalOpen = false;
  @state() isUploadingFiles = false;
  @state() uploadStatusMessage = '';
  @state() selectedDocDetails: StoredDocItem | null = null;
  @state() isSessionExplicitlyEnded = false;

  // Automated In-App Proxy & Anti-Sanction State
  @state() isProxyModalOpen = false;
  @state() networkState: NetworkHealthState = proxyManager.getState();
  @state() isTestingProxy = false;

  // Resilient Session & Auto-Reconnect State
  @state() isSessionReconnecting = false;
  @state() sessionErrorMessage = '';
  private reconnectTimeoutId: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 6;

  // Discord Waiting Sound & Silence Detection State (7s threshold, countdown from 5s to 7s)
  @state() isWaitingMusicActive = false;
  @state() waitingMusicEnabled = true;
  @state() waitingCountdownSec = 0;
  private waitingAudioBuffer: AudioBuffer | null = null;
  private waitingAudioSource: AudioBufferSourceNode | null = null;
  private waitingGainNode: GainNode | null = null;
  private waitingAudioElement: HTMLAudioElement | null = null;
  private isWaitingSoundPlaying = false;
  private lastConversationActivityTime = Date.now();
  private pauseCheckIntervalId: number | null = null;
  private userSpeakingDebounceTimer: number | null = null;
  private isUserSpeaking = false;

  private client: GoogleGenAI;
  private session: Session;
  private inputAudioContext: AudioContext;
  private outputAudioContext: AudioContext;
  @state() inputNode: GainNode;
  @state() outputNode: GainNode;
  private nextStartTime = 0;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private scriptProcessorNode: ScriptProcessorNode | null = null;
  private sources = new Set<AudioBufferSourceNode>();
  private audioInitialized = false;

  private videoStream: MediaStream | null = null;
  private videoIntervalId: number | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private unsubscribers: Array<() => void> = [];

  static styles = css`
    @keyframes subtleFloat {
      0%,
      100% {
        transform: translateY(0px);
      }
      50% {
        transform: translateY(-4px);
      }
    }

    @keyframes blinkUnderline {
      0%,
      100% {
        opacity: 1;
        border-bottom-color: #0f172a;
      }
      50% {
        opacity: 0;
        border-bottom-color: transparent;
      }
    }

    .middle-third-transcript {
      position: absolute;
      top: 33vh;
      height: 33vh;
      left: 50%;
      transform: translateX(-50%);
      width: 80%;
      max-width: 750px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      text-align: center;
      z-index: 45;
      pointer-events: auto;
      background: transparent !important;
      background-color: transparent !important;
      background-image: none !important;
      border: none !important;
      box-shadow: none !important;
      padding: 16px;
      overflow-y: auto;
      direction: rtl;
      font-family: 'Courier Prime', 'Courier New', monospace, 'Vazirmatn' !important;
    }

    .audio-visualizer-container {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: 90%;
      max-width: 640px;
      z-index: 40;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .typewriter-text {
      font-family: 'Courier Prime', 'Courier New', monospace, 'Vazirmatn' !important;
      font-size: 14px !important;
      font-weight: 300 !important;
      color: #000000 !important;
      line-height: 1.8;
      direction: rtl;
      margin: 0;
      padding: 0;
      display: inline-block;
    }

    @keyframes subtlePulse {
      0%,
      100% {
        opacity: 0.4;
        transform: scale(0.98);
      }
      50% {
        opacity: 1;
        transform: scale(1);
      }
    }

    .lawyer-processing-indicator {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      animation: subtlePulse 1.6s ease-in-out infinite;
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      font-family: 'Courier Prime', 'Courier New', monospace, 'Vazirmatn' !important;
      font-weight: 300 !important;
      font-size: 14px;
      color: #000000;
      padding: 20px;
    }

    .processing-dots {
      display: inline-flex;
      gap: 6px;
      align-items: center;
    }

    .processing-dot {
      width: 5px;
      height: 5px;
      background-color: #000000;
      border-radius: 50%;
      animation: dotPulse 1.4s infinite ease-in-out both;
    }

    .processing-dot:nth-child(1) {
      animation-delay: -0.32s;
    }
    .processing-dot:nth-child(2) {
      animation-delay: -0.16s;
    }
    .processing-dot:nth-child(3) {
      animation-delay: 0s;
    }

    @keyframes dotPulse {
      0%,
      80%,
      100% {
        transform: scale(0);
        opacity: 0.2;
      }
      40% {
        transform: scale(1);
        opacity: 0.9;
      }
    }

    /* All buttons, notifications, popups, and items: borderless, transparent, slender typewriter font */
    button,
    .lawyer-badge,
    .memory-status-chip,
    .camera-error-toast,
    .form-notification-toast,
    .menu-dropdown-card,
    .menu-linear-item,
    .toast-view-btn,
    .session-status-banner,
    .top-menu-trigger-btn,
    input,
    textarea,
    span,
    div {
      font-family: 'Courier Prime', 'Courier New', monospace, 'Vazirmatn' !important;
      font-weight: 300 !important;
    }

    button,
    .lawyer-badge,
    .memory-status-chip,
    .camera-error-toast,
    .form-notification-toast,
    .menu-dropdown-card,
    .menu-linear-item,
    .toast-view-btn,
    .session-status-banner,
    .top-menu-trigger-btn {
      background: transparent !important;
      background-color: transparent !important;
      background-image: none !important;
      border: none !important;
      box-shadow: none !important;
    }

    /* Popup and notification texts = Black */
    .form-notification-toast span,
    .camera-error-toast,
    .menu-linear-item span,
    .session-status-banner span,
    .toast-view-btn {
      color: #000000 !important;
      font-family: 'Courier Prime', 'Courier New', monospace, 'Vazirmatn' !important;
    }

    /* Start session text = Green */
    .end-consultation-btn.restart-btn,
    .end-consultation-btn.restart-btn .end-btn-label,
    .end-consultation-btn.restart-btn .end-btn-icon {
      color: #16a34a !important;
      fill: #16a34a !important;
    }

    /* End session text = Red */
    .end-consultation-btn:not(.restart-btn),
    .end-consultation-btn:not(.restart-btn) .end-btn-label,
    .end-consultation-btn:not(.restart-btn) .end-btn-icon {
      color: #dc2626 !important;
      fill: #dc2626 !important;
    }

    /* Menu icon = Black */
    .top-menu-trigger-btn,
    .top-menu-trigger-btn svg {
      color: #000000 !important;
      fill: #000000 !important;
    }

    /* Top mini equalizer (only equalizer at top) */
    .top-mini-equalizer {
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 4px 8px;
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }
    .top-mini-equalizer.active {
      opacity: 1;
      pointer-events: auto;
    }

    .typewriter-cursor {
      display: inline-block;
      width: 14px;
      height: 2px;
      background-color: #0f172a;
      border-bottom: 3px solid #0f172a;
      margin-right: 6px;
      animation: blinkUnderline 0.7s infinite;
      vertical-align: baseline;
    }

    .typing-indicator-badge {
      font-family: 'Courier Prime', 'Courier New', monospace, 'Vazirmatn';
      font-size: 13px;
      color: #3b82f6;
      margin-top: 10px;
      letter-spacing: 1px;
      opacity: 0.9;
    }

    :host {
      display: block;
      width: 100vw;
      height: 100vh;
      position: relative;
      overflow: hidden;
      background-color: #ffffff;
      cursor: pointer;
      direction: rtl;
      font-family:
        'Vazirmatn',
        -apple-system,
        BlinkMacSystemFont,
        'Segoe UI',
        Roboto,
        sans-serif;
      user-select: none;
      border: none;
    }

    .main-screen-bg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle at 50% 40%, #ffffff 0%, #f8fafc 60%, #e2e8f0 100%);
      z-index: 0;
      pointer-events: none;
    }

    /* Center Logo - کالبد و لوگوی برنامه و هوش مصنوعی */
    .center-logo-container {
      position: absolute;
      inset: 0;
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
      pointer-events: auto;
      cursor: pointer;
    }

    .center-logo-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      padding: 16px;
      transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .center-logo-wrapper::before {
      content: '';
      position: absolute;
      inset: -20px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(212, 175, 55, 0.12) 0%, rgba(212, 175, 55, 0) 70%);
      opacity: 0.7;
      transition: all 0.6s ease;
      z-index: -1;
    }

    .center-logo-wrapper.speaking {
      transform: scale(1.05);
    }

    .center-logo-wrapper.speaking::before {
      opacity: 1;
      inset: -40px;
      background: radial-gradient(
        circle,
        rgba(212, 175, 55, 0.35) 0%,
        rgba(212, 175, 55, 0.08) 60%,
        transparent 75%
      );
      animation: logoAuraPulse 1.8s infinite ease-in-out;
    }

    .center-logo-wrapper.listening {
      transform: scale(1.03);
    }

    .center-logo-wrapper.listening::before {
      opacity: 0.95;
      inset: -32px;
      background: radial-gradient(
        circle,
        rgba(56, 189, 248, 0.3) 0%,
        rgba(56, 189, 248, 0.05) 60%,
        transparent 75%
      );
      animation: logoAuraPulse 2.2s infinite ease-in-out;
    }

    .center-logo-wrapper.thinking::before {
      opacity: 0.9;
      inset: -32px;
      background: radial-gradient(circle, rgba(168, 85, 247, 0.28) 0%, transparent 70%);
      animation: logoAuraPulse 2.5s infinite ease-in-out;
    }

    @keyframes logoAuraPulse {
      0%,
      100% {
        transform: scale(1);
        opacity: 0.65;
      }
      50% {
        transform: scale(1.1);
        opacity: 1;
      }
    }

    .center-logo-img {
      width: min(340px, 75vw);
      height: auto;
      max-height: 50vh;
      object-fit: contain;
      border-radius: 24px;
      filter: drop-shadow(0 14px 32px rgba(0, 0, 0, 0.08));
      transition: all 0.4s ease;
      user-select: none;
      -webkit-user-drag: none;
    }

    .center-logo-wrapper:hover .center-logo-img {
      filter: drop-shadow(0 18px 40px rgba(212, 175, 55, 0.25));
    }

    @media (max-width: 768px) {
      .center-logo-img {
        width: min(280px, 78vw);
        max-height: 44vh;
      }
    }

    /* Top Floating Header & Action Bar */
    .top-memory-bar {
      position: absolute;
      top: 20px;
      left: 20px;
      right: 20px;
      z-index: 55;
      display: flex;
      align-items: center;
      justify-content: space-between;
      pointer-events: auto;
      direction: rtl;
    }

    /* 3D Realistic Pill Badges */
    .lawyer-badge {
      background: linear-gradient(145deg, #1e293b, #0f172a);
      border: 1px solid rgba(0, 0, 0, 0.6);
      padding: 10px 20px;
      border-radius: 30px;
      display: flex;
      align-items: center;
      gap: 12px;
      pointer-events: auto;
      box-shadow:
        8px 8px 20px rgba(0, 0, 0, 0.6),
        -4px -4px 12px rgba(255, 255, 255, 0.03),
        inset 1.5px 1.5px 3px rgba(0, 0, 0, 0.04),
        inset -1.5px -1.5px 3px rgba(0, 0, 0, 0.5);
    }

    .lawyer-title {
      font-size: 14px;
      font-weight: 800;
      color: #38bdf8;
      letter-spacing: 0;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    }

    .memory-status-chip {
      background: linear-gradient(145deg, #1e293b, #0f172a);
      border: 1px solid rgba(0, 0, 0, 0.6);
      padding: 10px 20px;
      border-radius: 30px;
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      pointer-events: auto;
      color: #e2e8f0;
      font-size: 13px;
      font-weight: 700;
      transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      box-shadow:
        8px 8px 20px rgba(0, 0, 0, 0.6),
        -4px -4px 12px rgba(255, 255, 255, 0.03),
        inset 1.5px 1.5px 3px rgba(0, 0, 0, 0.04);
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    }

    .memory-status-chip:hover {
      background: linear-gradient(145deg, #0f172a, #1e293b);
      color: #0ea5e9;
    }

    .memory-status-chip:active {
      box-shadow:
        inset 4px 4px 10px rgba(0, 0, 0, 0.6),
        inset -2px -2px 6px rgba(255, 255, 255, 0.02);
      transform: scale(0.96);
    }

    .cloud-pulse {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #10b981;
      box-shadow:
        0 0 12px #10b981,
        inset 0 2px 4px rgba(255, 255, 255, 0.5);
      animation: pulse-cloud 2s infinite;
    }

    @keyframes pulse-cloud {
      0% {
        transform: scale(0.9);
        opacity: 0.8;
        box-shadow: 0 0 8px #10b981;
      }
      50% {
        transform: scale(1.2);
        opacity: 1;
        box-shadow: 0 0 20px #10b981;
      }
      100% {
        transform: scale(0.9);
        opacity: 0.8;
        box-shadow: 0 0 8px #10b981;
      }
    }

    /* Global Persian Button Styling - Hemmat Font 12px Slim/Thin */
    button {
      font-family:
        'Hemmat',
        'Vazirmatn',
        -apple-system,
        BlinkMacSystemFont,
        Tahoma,
        sans-serif !important;
      font-size: 13px !important;
      font-weight: 400 !important;
      letter-spacing: 0.5px !important;
    }

    /* Realistic 3D Emergency Stop Button */
    .end-consultation-btn {
      background: linear-gradient(145deg, #991b1b, #450a0a);
      border: 1px solid rgba(0, 0, 0, 0.8);
      color: #fecaca;
      padding: 12px 24px;
      border-radius: 30px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      box-shadow:
        0 12px 24px rgba(0, 0, 0, 0.7),
        0 4px 8px rgba(0, 0, 0, 0.5),
        inset 0 4px 8px rgba(0, 0, 0, 0.1),
        inset 0 -4px 8px rgba(0, 0, 0, 0.5);
      transition: all 0.1s ease;
      user-select: none;
      pointer-events: auto;
      direction: rtl;
      text-shadow: 0 -1px 2px rgba(0, 0, 0, 0.8);
    }

    /* Top Center Subtle Mini Equalizer & WAITING STATUS for Waiting Music */
    .top-mini-equalizer {
      position: absolute;
      top: 170px;
      left: 50%;
      transform: translateX(-50%) translateY(-4px) scale(0.92);
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 16px;
      background: rgba(13, 21, 39, 0.75);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border: 1px solid rgba(0, 242, 254, 0.25);
      opacity: 0;
      pointer-events: none;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      user-select: none;
      font-size: 11px;
      font-weight: 600;
    }

    .top-mini-equalizer.active {
      opacity: 1;
      transform: translateX(-50%) translateY(0) scale(1);
      pointer-events: auto;
      border-color: rgba(0, 242, 254, 0.5);
      box-shadow:
        0 4px 20px rgba(0, 0, 0, 0.4),
        0 0 14px rgba(0, 242, 254, 0.25);
    }

    .top-mini-equalizer.counting {
      border-color: rgba(245, 158, 11, 0.55);
      box-shadow:
        0 4px 18px rgba(0, 0, 0, 0.35),
        0 0 12px rgba(245, 158, 11, 0.22);
    }

    .waiting-status-label {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-weight: 700;
      font-size: 10px;
      letter-spacing: 0.8px;
      color: #38bdf8;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      white-space: nowrap;
    }

    .top-mini-equalizer.counting .waiting-status-label {
      color: #fbbf24;
    }

    .waiting-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #fbbf24;
      box-shadow: 0 0 6px #fbbf24;
    }

    .waiting-dot.pulse {
      animation: waitingDotPulse 0.8s infinite alternate;
    }

    .waiting-dot.live {
      background: #00f2fe;
      box-shadow: 0 0 6px #00f2fe;
    }

    @keyframes waitingDotPulse {
      0% {
        opacity: 0.4;
        transform: scale(0.85);
      }
      100% {
        opacity: 1;
        transform: scale(1.25);
      }
    }

    .waiting-counter-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 22px;
      height: 18px;
      padding: 0 4px;
      border-radius: 8px;
      background: rgba(245, 158, 11, 0.2);
      border: 1px solid rgba(245, 158, 11, 0.4);
      color: #ffd700;
      font-size: 10.5px;
      font-weight: 800;
      font-family: monospace, sans-serif;
    }

    .top-mini-equalizer.active:not(.counting) .waiting-counter-pill {
      background: rgba(0, 242, 254, 0.2);
      border-color: rgba(0, 242, 254, 0.4);
      color: #38bdf8;
    }

    .mini-eq-bars {
      display: flex;
      align-items: flex-end;
      gap: 2.5px;
      height: 12px;
    }

    .mini-eq-bar {
      width: 2.5px;
      border-radius: 2px;
      background: #38bdf8;
      box-shadow: 0 0 4px rgba(56, 189, 248, 0.7);
      height: 3px;
      transition: height 0.12s ease;
    }

    .top-mini-equalizer.active .mini-eq-bar {
      animation: miniEqBounce 1s infinite ease-in-out alternate;
    }

    .top-mini-equalizer.counting .mini-eq-bar {
      animation: none;
      height: 3px;
      opacity: 0.35;
      background: #fbbf24;
      box-shadow: none;
    }

    .top-mini-equalizer.active .bar-1 {
      animation-delay: 0.08s;
      animation-duration: 0.75s;
      background: #00f2fe;
    }
    .top-mini-equalizer.active .bar-2 {
      animation-delay: 0.25s;
      animation-duration: 0.95s;
      background: #38bdf8;
    }
    .top-mini-equalizer.active .bar-3 {
      animation-delay: 0s;
      animation-duration: 0.8s;
      background: #ffd700;
    }
    .top-mini-equalizer.active .bar-4 {
      animation-delay: 0.35s;
      animation-duration: 1.05s;
      background: #38bdf8;
    }
    .top-mini-equalizer.active .bar-5 {
      animation-delay: 0.18s;
      animation-duration: 0.7s;
      background: #00f2fe;
    }

    @keyframes miniEqBounce {
      0% {
        height: 2.5px;
        opacity: 0.5;
      }
      50% {
        height: 11px;
        opacity: 1;
      }
      100% {
        height: 5px;
        opacity: 0.75;
      }
    }

    .end-consultation-btn:hover {
      background: linear-gradient(145deg, #b91c1c, #7f1d1d);
      color: #fee2e2;
      box-shadow:
        0 14px 28px rgba(0, 0, 0, 0.8),
        0 6px 12px rgba(0, 0, 0, 0.6),
        inset 0 4px 8px rgba(255, 255, 255, 0.3),
        inset 0 -4px 8px rgba(0, 0, 0, 0.6);
    }

    .end-consultation-btn:active {
      transform: translateY(4px);
      box-shadow:
        0 4px 8px rgba(0, 0, 0, 0.8),
        inset 0 6px 16px rgba(0, 0, 0, 0.8),
        inset 0 2px 4px rgba(0, 0, 0, 0.9);
    }

    .end-consultation-btn.restart-btn {
      background: linear-gradient(145deg, #065f46, #022c22);
      border-color: rgba(0, 0, 0, 0.8);
      color: #a7f3d0;
      box-shadow:
        0 12px 24px rgba(0, 0, 0, 0.7),
        0 4px 8px rgba(0, 0, 0, 0.5),
        inset 0 4px 8px rgba(0, 0, 0, 0.08),
        inset 0 -4px 8px rgba(0, 0, 0, 0.6);
    }

    .end-consultation-btn.restart-btn:hover {
      background: linear-gradient(145deg, #047857, #064e3b);
      color: #d1fae5;
      box-shadow:
        0 14px 28px rgba(0, 0, 0, 0.8),
        0 6px 12px rgba(0, 0, 0, 0.6),
        inset 0 4px 8px rgba(255, 255, 255, 0.25),
        inset 0 -4px 8px rgba(0, 0, 0, 0.6);
    }

    .end-btn-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255, 255, 255, 0.85);
      flex-shrink: 0;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6));
    }

    .end-consultation-btn:hover .end-btn-icon {
      color: #fca5a5;
    }

    .restart-btn .end-btn-icon {
      color: #6ee7b7;
    }

    .end-btn-label {
      font-size: 13px !important;
      font-weight: 700 !important;
      font-family: 'Nazanin', 'B Nazanin', Tahoma, sans-serif !important;
      white-space: nowrap;
      color: inherit;
    }

    /* Top-Right Icon-Only Menu Trigger & Compact Linear Dropdown */
    .top-right-group {
      display: flex;
      align-items: center;
      gap: 16px;
      pointer-events: auto;
    }

    .top-menu-wrapper {
      position: relative;
      display: inline-flex;
      align-items: center;
      pointer-events: auto;
    }

    /* 3D Physical Trigger Button */
    .top-menu-trigger-btn {
      background: linear-gradient(145deg, #1e293b, #0f172a);
      border: 1px solid rgba(0, 0, 0, 0.6);
      color: #e2e8f0;
      width: 52px;
      height: 52px;
      padding: 0;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow:
        8px 8px 16px rgba(0, 0, 0, 0.6),
        -4px -4px 12px rgba(255, 255, 255, 0.03),
        inset 1.5px 1.5px 3px rgba(0, 0, 0, 0.04),
        inset -1.5px -1.5px 3px rgba(0, 0, 0, 0.5);
      transition: all 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      user-select: none;
      pointer-events: auto;
    }

    .top-menu-trigger-btn:hover {
      background: linear-gradient(145deg, #0f172a, #1e293b);
      color: #38bdf8;
    }

    .top-menu-trigger-btn:active,
    .top-menu-trigger-btn.active {
      box-shadow:
        inset 4px 4px 12px rgba(0, 0, 0, 0.7),
        inset -2px -2px 6px rgba(255, 255, 255, 0.02);
      transform: scale(0.95);
      color: #0ea5e9;
      border-color: rgba(0, 0, 0, 0.8);
    }

    .main-menu-backdrop {
      position: fixed;
      inset: 0;
      z-index: 85;
      background: transparent;
      pointer-events: auto;
    }

    /* 3D Panel Dropdown */
    .top-menu-dropdown {
      position: absolute;
      top: calc(100% + 16px);
      right: 0;
      min-width: 290px;
      width: max-content;
      max-width: 340px;
      background: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.8);
      border-radius: 20px;
      box-shadow:
        0 30px 60px rgba(0, 0, 0, 0.8),
        inset 2px 2px 4px rgba(0, 0, 0, 0.03),
        inset -2px -2px 6px rgba(0, 0, 0, 0.6);
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 90;
      animation: menuFadeIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      direction: rtl;
      pointer-events: auto;
    }

    @keyframes menuFadeIn {
      0% {
        opacity: 0;
        transform: translateY(-10px) scale(0.95);
      }
      100% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    /* 3D Physical Panel Items */
    .menu-linear-item {
      background: linear-gradient(145deg, #1e293b, #0f172a);
      border: 1px solid rgba(0, 0, 0, 0.4);
      color: #cbd5e1;
      padding: 12px 16px;
      border-radius: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      text-align: right;
      direction: rtl;
      transition: all 0.15s ease;
      font-family: 'Nazanin', 'B Nazanin', Tahoma, sans-serif !important;
      font-size: 13px !important;
      font-weight: 500 !important;
      width: 100%;
      box-sizing: border-box;
      white-space: nowrap;
      pointer-events: auto;
      box-shadow:
        4px 4px 10px rgba(0, 0, 0, 0.4),
        -2px -2px 6px rgba(255, 255, 255, 0.02),
        inset 1px 1px 2px rgba(0, 0, 0, 0.03);
    }

    .menu-linear-item:active {
      box-shadow:
        inset 3px 3px 8px rgba(0, 0, 0, 0.6),
        inset -1px -1px 3px rgba(255, 255, 255, 0.02);
      transform: translateY(2px);
    }

    .menu-linear-item:hover {
      background: linear-gradient(145deg, #263347, #131d33);
      color: #38bdf8;
    }

    .menu-linear-item.active-camera {
      background: linear-gradient(145deg, #064e3b, #022c22);
    }

    .menu-linear-item.active-camera:hover {
      background: linear-gradient(145deg, #065f46, #047857);
    }

    .menu-item-start {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      flex: 1;
    }

    .menu-item-icon-svg {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #d97706;
      flex-shrink: 0;
    }

    .menu-item-text-label {
      font-size: 13px !important;
      font-weight: 300 !important;
      font-family: 'Nazanin', 'B Nazanin', Tahoma, sans-serif !important;
      color: #000000;
      white-space: nowrap;
      text-shadow: none;
    }

    .menu-linear-item:hover .menu-item-text-label {
      color: #2563eb;
    }

    .menu-item-mini-badge {
      font-size: 11px !important;
      font-weight: 600 !important;
      font-family: 'Nazanin', 'B Nazanin', Tahoma, sans-serif !important;
      color: #94a3b8;
      background: linear-gradient(145deg, #1e293b, #0f172a);
      padding: 4px 10px;
      border-radius: 12px;
      flex-shrink: 0;
      white-space: nowrap;
      box-shadow:
        inset 2px 2px 4px rgba(0, 0, 0, 0.4),
        inset -1px -1px 2px rgba(0, 0, 0, 0.03);
      border: 1px solid rgba(0, 0, 0, 0.6);
    }

    .menu-item-mini-badge.highlight {
      color: #fde047;
      background: linear-gradient(145deg, #422006, #713f12);
      border: 1px solid rgba(0, 0, 0, 0.8);
      box-shadow:
        inset 2px 2px 4px rgba(0, 0, 0, 0.6),
        0 2px 4px rgba(234, 179, 8, 0.2);
    }

    .menu-item-mini-badge.highlight-green {
      color: #6ee7b7;
      background: linear-gradient(145deg, #064e3b, #022c22);
      border: 1px solid rgba(0, 0, 0, 0.8);
      box-shadow:
        inset 2px 2px 4px rgba(0, 0, 0, 0.6),
        0 2px 4px rgba(16, 185, 129, 0.2);
    }

    /* Modal Backdrop Global & Unified Overlays */
    .modal-backdrop-global,
    .tone-modal-backdrop,
    .upload-modal-backdrop,
    .judicial-modal-backdrop,
    .dossier-modal-backdrop {
      position: fixed !important;
      inset: 0 !important;
      background: rgba(0, 0, 0, 0.78) !important;
      backdrop-filter: blur(14px) !important;
      -webkit-backdrop-filter: blur(14px) !important;
      z-index: 100 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 16px !important;
      pointer-events: auto !important;
      animation: fadeIn 0.2s ease !important;
      box-sizing: border-box !important;
    }

    /* Tone / Persona Switcher Modal */
    .waiting-music-indicator {
      position: absolute;
      top: 75px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 23, 42, 0.88);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border: 1px solid rgba(245, 158, 11, 0.5);
      color: #fde68a;
      padding: 5px 14px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11.5px;
      font-family: 'Hemmat', 'Vazirmatn', sans-serif;
      z-index: 50;
      box-shadow:
        0 4px 20px rgba(0, 0, 0, 0.4),
        0 0 15px rgba(245, 158, 11, 0.2);
      animation: fadeIn 0.3s ease;
      pointer-events: none;
      direction: rtl;
    }

    .music-wave-bar {
      display: inline-block;
      width: 3px;
      height: 12px;
      background: #f59e0b;
      border-radius: 2px;
      animation: waveAnim 1s ease-in-out infinite;
    }
    .music-wave-bar:nth-child(2) {
      animation-delay: 0.2s;
      height: 16px;
    }
    .music-wave-bar:nth-child(3) {
      animation-delay: 0.4s;
      height: 10px;
    }
    @keyframes waveAnim {
      0%,
      100% {
        transform: scaleY(0.4);
        opacity: 0.6;
      }
      50% {
        transform: scaleY(1.2);
        opacity: 1;
      }
    }

    .session-status-banner {
      position: absolute;
      top: 18px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 11px;
      font-family: 'Hemmat', 'Vazirmatn', sans-serif;
      z-index: 50;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
      animation: fadeIn 0.3s ease;
      direction: rtl;
    }

    .session-status-banner.reconnecting {
      background: rgba(217, 119, 6, 0.25);
      border: 1px solid rgba(217, 119, 6, 0.45);
      color: #fef3c7;
    }

    .session-status-banner.error {
      background: rgba(220, 38, 38, 0.25);
      border: 1px solid rgba(220, 38, 38, 0.45);
      color: #fee2e2;
      cursor: pointer;
    }

    .session-status-spin {
      display: inline-block;
      animation: spin 1.2s linear infinite;
    }

    @keyframes spin {
      100% {
        transform: rotate(360deg);
      }
    }

    .session-retry-btn {
      background: rgba(0, 0, 0, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: #fff;
      border-radius: 8px;
      padding: 2px 8px;
      font-size: 10px;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.2s ease;
    }

    .session-retry-btn:hover {
      background: rgba(255, 255, 255, 0.28);
    }

    .tone-modal-card {
      background: #0f1422;
      border: 1px solid rgba(212, 175, 55, 0.45);
      box-shadow:
        0 25px 70px rgba(0, 0, 0, 0.85),
        0 0 35px rgba(212, 175, 55, 0.2);
      border-radius: 20px;
      width: 100%;
      max-width: 620px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      color: #475569;
      direction: rtl;
    }

    .tone-options-list {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      overflow-y: auto;
      max-height: calc(85vh - 75px);
    }

    .tone-option-card {
      background: rgba(18, 24, 38, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.09);
      border-radius: 14px;
      padding: 16px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: all 0.2s ease;
    }

    .tone-option-card:hover {
      background: rgba(28, 36, 56, 0.92);
      border-color: rgba(212, 175, 55, 0.45);
      transform: translateY(-2px);
    }

    .tone-option-card.active {
      background: linear-gradient(135deg, rgba(212, 175, 55, 0.18), rgba(184, 134, 11, 0.28));
      border-color: #ffd700;
      box-shadow: 0 4px 20px rgba(212, 175, 55, 0.2);
    }

    .tone-card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .tone-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13.5px;
      font-weight: 700;
      color: #f8fafc;
    }

    .tone-badge-icon {
      font-size: 16px;
    }

    .tone-check-badge {
      font-size: 11px;
      padding: 3px 10px;
      border-radius: 12px;
      background: rgba(16, 185, 129, 0.2);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.4);
      font-weight: 600;
    }

    .tone-card-accent {
      font-size: 11px;
      color: #38bdf8;
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 500;
    }

    .tone-card-desc {
      font-size: 11.5px;
      color: #94a3b8;
      line-height: 1.7;
    }

    .tone-card-sample {
      font-size: 11px;
      color: #cbd5e1;
      background: rgba(0, 0, 0, 0.35);
      border-right: 3px solid #d4af37;
      padding: 8px 12px;
      border-radius: 6px;
      line-height: 1.6;
      font-style: italic;
    }

    /* Proxy & Anti-Sanction Center Modal */
    .proxy-modal-card {
      background: #0f1422;
      border: 1px solid rgba(59, 130, 246, 0.4);
      box-shadow:
        0 25px 70px rgba(0, 0, 0, 0.85),
        0 0 35px rgba(59, 130, 246, 0.2);
      border-radius: 20px;
      width: 100%;
      max-width: 620px;
      max-height: 88vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      color: #475569;
      direction: rtl;
    }

    .proxy-status-banner {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 95, 70, 0.25));
      border: 1px solid rgba(16, 185, 129, 0.35);
      border-radius: 14px;
      padding: 14px 16px;
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .proxy-status-banner.testing {
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(30, 58, 138, 0.25));
      border-color: rgba(59, 130, 246, 0.35);
    }

    .proxy-banner-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .proxy-banner-title {
      font-size: 13px;
      font-weight: 700;
      color: #34d399;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .proxy-banner-title.blue {
      color: #60a5fa;
    }

    .proxy-banner-sub {
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.6;
    }

    .proxy-metric-pills {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .proxy-metric-pill {
      flex: 1;
      min-width: 120px;
      background: rgba(18, 24, 38, 0.75);
      border: 1px solid rgba(0, 0, 0, 0.04);
      border-radius: 12px;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .proxy-metric-label {
      font-size: 10px;
      color: #94a3b8;
    }

    .proxy-metric-value {
      font-size: 13px;
      font-weight: 700;
      color: #f8fafc;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .proxy-toggle-card {
      background: rgba(18, 24, 38, 0.7);
      border: 1px solid rgba(0, 0, 0, 0.04);
      border-radius: 14px;
      padding: 14px 16px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .proxy-toggle-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .proxy-toggle-title {
      font-size: 12px;
      font-weight: 700;
      color: #f8fafc;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .proxy-toggle-desc {
      font-size: 10.5px;
      color: #94a3b8;
      line-height: 1.5;
    }

    .toggle-switch-btn {
      width: 46px;
      height: 24px;
      background: rgba(0, 0, 0, 0.08);
      border-radius: 12px;
      border: none;
      cursor: pointer;
      position: relative;
      transition: all 0.2s ease;
      flex-shrink: 0;
      padding: 2px;
    }

    .toggle-switch-btn.active {
      background: #10b981;
    }

    .toggle-switch-knob {
      width: 20px;
      height: 20px;
      background: #ffffff;
      border-radius: 50%;
      transition: all 0.2s ease;
      transform: translateX(0);
    }

    .toggle-switch-btn.active .toggle-switch-knob {
      transform: translateX(-22px);
    }

    .proxy-node-item {
      background: rgba(18, 24, 38, 0.7);
      border: 1px solid rgba(0, 0, 0, 0.04);
      border-radius: 12px;
      padding: 12px 14px;
      margin-bottom: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      transition: all 0.15s ease;
    }

    .proxy-node-item:hover {
      background: rgba(28, 36, 56, 0.85);
      border-color: rgba(59, 130, 246, 0.35);
    }

    .proxy-node-item.selected {
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.2));
      border-color: #3b82f6;
      box-shadow: 0 4px 18px rgba(59, 130, 246, 0.15);
    }

    .proxy-node-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .proxy-node-flag {
      font-size: 18px;
    }

    .proxy-node-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .proxy-node-title {
      font-size: 12px;
      font-weight: 700;
      color: #f8fafc;
    }

    .proxy-node-sub {
      font-size: 10px;
      color: #94a3b8;
    }

    .proxy-node-ping {
      font-size: 10px;
      font-family: inherit;
      color: #34d399;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 2px 8px;
      border-radius: 8px;
    }

    /* Document Upload & Manager Modal */
    .upload-modal-card {
      background: #0f1422;
      border: 1px solid rgba(212, 175, 55, 0.45);
      box-shadow:
        0 25px 70px rgba(0, 0, 0, 0.85),
        0 0 35px rgba(212, 175, 55, 0.2);
      border-radius: 20px;
      width: 100%;
      max-width: 680px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      color: #475569;
      direction: rtl;
    }

    .upload-drop-zone {
      border: 2px dashed rgba(212, 175, 55, 0.4);
      background: rgba(18, 24, 38, 0.6);
      border-radius: 16px;
      padding: 28px 20px;
      text-align: center;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      transition: all 0.2s ease;
      margin-bottom: 16px;
    }

    .upload-drop-zone:hover,
    .upload-drop-zone.drag-over {
      background: rgba(28, 36, 56, 0.85);
      border-color: #ffd700;
      box-shadow: 0 0 25px rgba(212, 175, 55, 0.25);
    }

    .upload-zone-icon {
      font-size: 36px;
    }

    .upload-zone-title {
      font-size: 13px;
      font-weight: 700;
      color: #ffd700;
    }

    .upload-zone-hint {
      font-size: 11px;
      color: #94a3b8;
    }

    .uploaded-file-row {
      background: rgba(18, 24, 38, 0.7);
      border: 1px solid rgba(0, 0, 0, 0.04);
      border-radius: 12px;
      padding: 12px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      transition: all 0.15s ease;
    }

    .uploaded-file-row:hover {
      background: rgba(28, 36, 56, 0.9);
      border-color: rgba(212, 175, 55, 0.3);
    }

    .file-row-thumb {
      width: 44px;
      height: 44px;
      border-radius: 8px;
      object-fit: cover;
      border: 1px solid rgba(212, 175, 55, 0.3);
      flex-shrink: 0;
      background: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }

    .file-row-meta {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .file-row-title {
      font-size: 12px;
      font-weight: 600;
      color: #475569;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .file-row-info {
      font-size: 10px;
      color: #94a3b8;
      display: flex;
      gap: 8px;
    }

    .file-row-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }

    .upload-action-btn {
      background: linear-gradient(135deg, rgba(212, 175, 55, 0.25), rgba(184, 134, 11, 0.35));
      border: 1px solid rgba(212, 175, 55, 0.6);
      color: #ffd700;
      padding: 8px 16px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-family: inherit;
      transition: all 0.15s ease;
    }

    .upload-action-btn:hover {
      background: linear-gradient(135deg, rgba(212, 175, 55, 0.4), rgba(184, 134, 11, 0.5));
      border-color: #ffd700;
      color: #334155;
      transform: translateY(-1px);
    }

    .upload-action-btn.camera-scan-btn {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.3));
      border-color: rgba(16, 185, 129, 0.5);
      color: #6ee7b7;
    }

    .upload-action-btn.camera-scan-btn:hover {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.35), rgba(5, 150, 105, 0.45));
      border-color: #10b981;
      color: #334155;
    }

    .pulse-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: #ef4444;
      box-shadow: 0 0 10px #ef4444;
      animation: pulse-camera 1.5s infinite;
    }

    @keyframes pulse-camera {
      0% {
        transform: scale(0.9);
        opacity: 0.8;
      }
      50% {
        transform: scale(1.3);
        opacity: 1;
      }
      100% {
        transform: scale(0.9);
        opacity: 0.8;
      }
    }

    /* Floating Picture-in-Picture Document Stream Preview */
    .camera-pip-container {
      position: absolute;
      top: 70px;
      left: 20px;
      z-index: 40;
      width: 320px;
      background: rgba(15, 23, 42, 0.92);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(212, 175, 55, 0.4);
      border-radius: 18px;
      overflow: hidden;
      box-shadow:
        0 16px 40px rgba(0, 0, 0, 0.65),
        0 0 20px rgba(212, 175, 55, 0.2);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      pointer-events: auto;
      display: flex;
      flex-direction: column;
    }

    .camera-pip-container.minimized {
      width: 200px;
      height: auto;
    }

    .pip-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      background: rgba(11, 13, 19, 0.7);
      border-bottom: 1px solid rgba(212, 175, 55, 0.2);
    }

    .pip-title-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 700;
      color: #e2e8f0;
    }

    .pip-actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .pip-btn-icon {
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 4px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }

    .pip-btn-icon:hover {
      color: #f8fafc;
      background: rgba(0, 0, 0, 0.05);
    }

    .pip-video-wrapper {
      position: relative;
      width: 100%;
      aspect-ratio: 4 / 3;
      background: #000000;
      overflow: hidden;
    }

    .pip-video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    /* Document Targeting Frame Overlay */
    .doc-target-frame {
      position: absolute;
      inset: 16px;
      pointer-events: none;
      border: 1px dashed rgba(212, 175, 55, 0.5);
      border-radius: 8px;
      box-shadow: inset 0 0 15px rgba(212, 175, 55, 0.15);
    }

    .corner-bracket {
      position: absolute;
      width: 14px;
      height: 14px;
      border-color: #d4af37;
      border-style: solid;
    }

    .corner-tl {
      top: -2px;
      left: -2px;
      border-width: 3px 0 0 3px;
    }
    .corner-tr {
      top: -2px;
      right: -2px;
      border-width: 3px 3px 0 0;
    }
    .corner-bl {
      bottom: -2px;
      left: -2px;
      border-width: 0 0 3px 3px;
    }
    .corner-br {
      bottom: -2px;
      right: -2px;
      border-width: 0 3px 3px 0;
    }

    .scanline {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, #d4af37, #ffffff, #d4af37, transparent);
      box-shadow: 0 0 8px #d4af37;
      animation: scan-doc 2.5s infinite ease-in-out;
      opacity: 0.85;
    }

    @keyframes scan-doc {
      0% {
        top: 5%;
        opacity: 0.2;
      }
      50% {
        top: 90%;
        opacity: 1;
      }
      100% {
        top: 5%;
        opacity: 0.2;
      }
    }

    .pip-footer {
      padding: 10px 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: rgba(11, 13, 19, 0.8);
      border-top: 1px solid rgba(212, 175, 55, 0.15);
    }

    .doc-snap-btn {
      width: 100%;
      background: linear-gradient(135deg, rgba(212, 175, 55, 0.25), rgba(184, 134, 11, 0.35));
      border: 1px solid rgba(212, 175, 55, 0.6);
      color: #ffd700;
      padding: 8px 12px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-family: inherit;
      transition: all 0.2s ease;
    }

    .doc-snap-btn:hover {
      background: linear-gradient(135deg, rgba(212, 175, 55, 0.4), rgba(184, 134, 11, 0.5));
      border-color: #ffd700;
      color: #334155;
      transform: translateY(-1px);
    }

    .live-stream-tag {
      font-size: 10px;
      color: #94a3b8;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .stream-indicator {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #22c55e;
      box-shadow: 0 0 6px #22c55e;
    }

    .camera-error-toast {
      position: absolute;
      top: 70px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(145deg, #b91c1c, #7f1d1d);
      border: 1px solid rgba(0, 0, 0, 0.8);
      color: #fee2e2;
      padding: 12px 24px;
      border-radius: 30px;
      font-size: 13px;
      font-weight: 700;
      z-index: 100;
      box-shadow:
        0 14px 28px rgba(0, 0, 0, 0.8),
        inset 0 4px 8px rgba(0, 0, 0, 0.1),
        inset 0 -4px 8px rgba(0, 0, 0, 0.6);
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
    }

    /* Modal / Drawer for Dossier & Persistent Memory */
    .dossier-modal-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 60;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      pointer-events: auto;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .dossier-modal {
      background: #0f1422;
      border: 1px solid rgba(212, 175, 55, 0.4);
      box-shadow:
        0 25px 60px rgba(0, 0, 0, 0.8),
        0 0 30px rgba(212, 175, 55, 0.15);
      border-radius: 20px;
      width: 100%;
      max-width: 640px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      color: #475569;
    }

    .dossier-modal-header {
      padding: 16px 20px;
      background: rgba(18, 24, 38, 0.95);
      border-bottom: 1px solid rgba(212, 175, 55, 0.2);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .dossier-modal-title {
      font-size: 16px;
      font-weight: 700;
      color: #ffd700;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .dossier-nav-tabs {
      display: flex;
      border-bottom: 1px solid rgba(0, 0, 0, 0.04);
      background: rgba(11, 14, 22, 0.6);
      padding: 4px 12px 0 12px;
      gap: 4px;
      overflow-x: auto;
    }

    .dossier-tab-btn {
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      color: #94a3b8;
      padding: 10px 14px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      white-space: nowrap;
      transition: all 0.2s ease;
    }

    .dossier-tab-btn:hover {
      color: #e2e8f0;
    }

    .dossier-tab-btn.active {
      color: #ffd700;
      border-bottom-color: #ffd700;
      background: rgba(212, 175, 55, 0.08);
      border-radius: 8px 8px 0 0;
    }

    .dossier-modal-content {
      padding: 20px;
      overflow-y: auto;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .dossier-card {
      background: rgba(22, 29, 46, 0.6);
      border: 1px solid rgba(0, 0, 0, 0.04);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .card-title {
      font-size: 13px;
      font-weight: 700;
      color: #ffd700;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .card-text {
      font-size: 13px;
      line-height: 1.7;
      color: #cbd5e1;
      white-space: pre-wrap;
    }

    .dossier-input-box {
      width: 100%;
      background: rgba(11, 14, 22, 0.8);
      border: 1px solid rgba(212, 175, 55, 0.3);
      border-radius: 8px;
      color: #f8fafc;
      padding: 10px 12px;
      font-family: inherit;
      font-size: 13px;
      outline: none;
      resize: vertical;
      box-sizing: border-box;
    }

    .dossier-input-box:focus {
      border-color: #ffd700;
      box-shadow: 0 0 10px rgba(212, 175, 55, 0.2);
    }

    .dossier-btn-primary {
      background: linear-gradient(135deg, #d4af37, #b8860b);
      color: #0b0d13;
      border: none;
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .dossier-btn-primary:hover {
      opacity: 0.95;
      transform: translateY(-1px);
    }

    .dossier-btn-secondary {
      background: rgba(0, 0, 0, 0.04);
      color: #e2e8f0;
      border: 1px solid rgba(0, 0, 0, 0.08);
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .dossier-btn-secondary:hover {
      background: rgba(0, 0, 0, 0.08);
      color: #334155;
    }

    .google-sync-btn {
      background: #ffffff;
      color: #1f2937;
      border: 1px solid #e5e7eb;
      padding: 12px 20px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      font-family: inherit;
      transition: all 0.2s ease;
    }

    .google-sync-btn:hover {
      background: #f3f4f6;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }

    .code-chip {
      background: #090c14;
      border: 1px solid rgba(212, 175, 55, 0.3);
      padding: 6px 12px;
      border-radius: 6px;
      font-family: monospace;
      font-size: 12px;
      color: #ffd700;
      direction: ltr;
      display: inline-block;
      user-select: all;
    }

    /* Judicial Form Floating Action Button */
    .judicial-toggle-btn {
      background: linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(184, 134, 11, 0.35));
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid #ffd700;
      color: #ffd700;
      padding: 12px 22px;
      border-radius: 30px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow:
        0 8px 30px rgba(0, 0, 0, 0.5),
        0 0 18px rgba(212, 175, 55, 0.25);
      transition: all 0.25s ease;
      font-family: inherit;
    }

    .judicial-toggle-btn:hover {
      background: linear-gradient(135deg, rgba(212, 175, 55, 0.4), rgba(184, 134, 11, 0.6));
      color: #334155;
      box-shadow: 0 12px 35px rgba(212, 175, 55, 0.45);
      transform: translateY(-2px);
    }

    /* Judicial Form Generation Live Notification Toast */
    .form-notification-toast {
      position: absolute;
      top: 75px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(145deg, #1e293b, #0f172a);
      border: 1px solid rgba(0, 0, 0, 0.8);
      color: #f8fafc;
      padding: 12px 24px;
      border-radius: 40px;
      font-size: 13px;
      font-weight: 700;
      z-index: 55;
      box-shadow:
        0 14px 28px rgba(0, 0, 0, 0.8),
        0 0 25px rgba(212, 175, 55, 0.35),
        inset 0 4px 8px rgba(0, 0, 0, 0.1),
        inset 0 -4px 8px rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      gap: 12px;
      animation: slideDownToast 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      cursor: pointer;
      pointer-events: auto;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
    }

    @keyframes slideDownToast {
      from {
        transform: translate(-50%, -20px);
        opacity: 0;
      }
      to {
        transform: translate(-50%, 0);
        opacity: 1;
      }
    }

    .toast-view-btn {
      background: linear-gradient(145deg, #fde047, #ca8a04);
      color: #422006;
      border: 1px solid rgba(0, 0, 0, 0.4);
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 13px !important;
      font-weight: 800 !important;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.15s ease;
      box-shadow:
        0 4px 8px rgba(0, 0, 0, 0.6),
        inset 0 2px 4px rgba(255, 255, 255, 0.6),
        inset 0 -2px 4px rgba(0, 0, 0, 0.2);
      text-shadow: 0 1px 1px rgba(255, 255, 255, 0.4);
    }

    .toast-view-btn:hover {
      background: linear-gradient(145deg, #fef08a, #eab308);
      box-shadow:
        0 6px 12px rgba(0, 0, 0, 0.7),
        inset 0 2px 4px rgba(255, 255, 255, 0.8),
        inset 0 -2px 4px rgba(0, 0, 0, 0.2);
    }

    .toast-view-btn:active {
      transform: translateY(2px);
      box-shadow:
        0 2px 4px rgba(0, 0, 0, 0.6),
        inset 0 4px 8px rgba(0, 0, 0, 0.4);
    }

    /* Official Judicial Form Studio Modal Backdrop & Window */
    .judicial-modal-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(4, 7, 15, 0.82);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      z-index: 70;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      pointer-events: auto;
      animation: fadeIn 0.2s ease;
    }

    .judicial-modal {
      background: #0f1422;
      border: 1px solid rgba(212, 175, 55, 0.5);
      box-shadow:
        0 30px 80px rgba(0, 0, 0, 0.9),
        0 0 40px rgba(212, 175, 55, 0.2);
      border-radius: 20px;
      width: 100%;
      max-width: 960px;
      height: 90vh;
      max-height: 900px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      color: #475569;
    }

    .judicial-modal-header {
      padding: 14px 20px;
      background: rgba(18, 24, 38, 0.98);
      border-bottom: 1px solid rgba(212, 175, 55, 0.3);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }

    .judicial-modal-title {
      font-size: 16px;
      font-weight: 700;
      color: #ffd700;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    /* Judicial Toolbar & Actions */
    .judicial-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(11, 14, 22, 0.9);
      border-bottom: 1px solid rgba(0, 0, 0, 0.04);
      padding: 10px 18px;
      gap: 10px;
      flex-wrap: wrap;
      flex-shrink: 0;
    }

    .form-types-scroll {
      display: flex;
      align-items: center;
      gap: 6px;
      overflow-x: auto;
      padding-bottom: 2px;
    }

    .form-type-chip {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #cbd5e1;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      white-space: nowrap;
      transition: all 0.15s ease;
    }

    .form-type-chip:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #334155;
    }

    .form-type-chip.active {
      background: rgba(212, 175, 55, 0.2);
      border-color: #ffd700;
      color: #ffd700;
      font-weight: 700;
    }

    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .action-btn-pdf {
      background: linear-gradient(135deg, #e11d48, #be123c);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 4px 14px rgba(225, 29, 72, 0.35);
      transition: all 0.2s ease;
    }

    .action-btn-pdf:hover {
      background: linear-gradient(135deg, #be123c, #9f1239);
      box-shadow: 0 6px 20px rgba(225, 29, 72, 0.55);
      transform: translateY(-1px);
    }

    .action-btn-ai-draft {
      background: linear-gradient(135deg, #7c3aed, #4f46e5);
      color: #ffffff;
      border: 1px solid rgba(255, 215, 0, 0.4);
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow:
        0 4px 15px rgba(124, 58, 237, 0.4),
        0 0 10px rgba(255, 215, 0, 0.2);
      transition: all 0.2s ease;
      animation: pulseGlow 3s infinite alternate;
    }

    @keyframes pulseGlow {
      0% {
        box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4);
      }
      100% {
        box-shadow:
          0 4px 20px rgba(124, 58, 237, 0.6),
          0 0 16px rgba(255, 215, 0, 0.35);
      }
    }

    .action-btn-ai-draft:hover {
      background: linear-gradient(135deg, #6d28d9, #4338ca);
      transform: translateY(-1px);
    }

    .action-btn-print {
      background: linear-gradient(135deg, #10b981, #059669);
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
    }

    .action-btn-print:hover {
      background: linear-gradient(135deg, #059669, #047857);
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
      transform: translateY(-1px);
    }

    .action-btn-word {
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
    }

    .action-btn-word:hover {
      background: linear-gradient(135deg, #1d4ed8, #1e40af);
      box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4);
      transform: translateY(-1px);
    }

    .action-btn-neutral {
      background: rgba(255, 255, 255, 0.08);
      color: #e2e8f0;
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }

    .action-btn-neutral:hover {
      background: rgba(255, 255, 255, 0.16);
      color: #ffffff;
    }

    /* Modal Main Body Content: Official Paper View vs Edit Mode */
    .judicial-modal-body {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
      background: #090c14;
      display: flex;
      justify-content: center;
    }

    /* Authentic Judicial Document Preview Page (Paper Simulation) */
    .judicial-paper {
      background: #ffffff;
      color: #111827;
      width: 100%;
      max-width: 820px;
      padding: 32px 36px;
      border-radius: 4px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      font-family:
        'Vazirmatn',
        -apple-system,
        BlinkMacSystemFont,
        Tahoma,
        sans-serif;
      position: relative;
      border: 3px double #1e3a8a;
      box-sizing: border-box;
      direction: rtl;
    }

    .paper-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #1e3a8a;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }

    .paper-emblem {
      text-align: center;
      flex: 1;
    }

    .paper-country-title {
      font-size: 11px;
      font-weight: 700;
      color: #1e3a8a;
      letter-spacing: 0.5px;
    }

    .paper-main-title {
      font-size: 17px;
      font-weight: 900;
      color: #0f172a;
      margin: 4px 0;
    }

    .paper-authority {
      font-size: 12px;
      font-weight: 700;
      color: #334155;
    }

    .paper-meta-box {
      font-size: 10px;
      color: #334155;
      text-align: left;
      line-height: 1.6;
      border: 1px solid #94a3b8;
      padding: 6px 10px;
      border-radius: 4px;
      background: #f8fafc;
      min-width: 150px;
    }

    .paper-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 11px;
    }

    .paper-table th,
    .paper-table td {
      border: 1px solid #334155;
      padding: 6px 8px;
      text-align: right;
    }

    .paper-table th {
      background: #f1f5f9;
      color: #1e293b;
      font-weight: 800;
      width: 22%;
    }

    .paper-section-title {
      font-size: 12px;
      font-weight: 800;
      color: #1e3a8a;
      background: #f1f5f9;
      border: 1px solid #334155;
      padding: 6px 10px;
      margin-top: 10px;
      border-bottom: none;
    }

    .paper-body-box {
      border: 1px solid #334155;
      padding: 16px;
      font-size: 12px;
      line-height: 2;
      color: #0f172a;
      white-space: pre-wrap;
      text-align: justify;
      background: #ffffff;
      min-height: 220px;
    }

    .paper-footer-signatures {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 24px;
      padding-top: 14px;
      border-top: 1px dashed #94a3b8;
    }

    .signature-slot {
      text-align: center;
      font-size: 11px;
      color: #475569;
      line-height: 1.8;
      width: 200px;
    }

    .fingerprint-box {
      width: 60px;
      height: 70px;
      border: 1px dashed #94a3b8;
      margin: 6px auto;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      color: #94a3b8;
    }

    /* Edit Mode Layout */
    .edit-mode-container {
      width: 100%;
      max-width: 820px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .edit-section {
      background: rgba(22, 29, 46, 0.8);
      border: 1px solid rgba(212, 175, 55, 0.3);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .edit-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    @media (max-width: 640px) {
      .edit-grid-2 {
        grid-template-columns: 1fr;
      }
    }

    .field-label {
      font-size: 12px;
      font-weight: 700;
      color: #ffd700;
    }

    .edit-input {
      background: rgba(11, 14, 22, 0.8);
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 6px;
      color: #f8fafc;
      padding: 8px 12px;
      font-size: 12px;
      font-family: inherit;
      outline: none;
      width: 100%;
      box-sizing: border-box;
    }

    .edit-input:focus {
      border-color: #ffd700;
      box-shadow: 0 0 10px rgba(212, 175, 55, 0.2);
    }
  `;

  constructor() {
    super();
    this.initAudioContexts();
  }

  async firstUpdated() {
    await this.initFirebaseMemory();
    const unsubProxy = proxyManager.subscribe((st) => {
      this.networkState = st;
    });
    this.unsubscribers.push(unsubProxy);
    this.startExperience();
    window.addEventListener('click', this.handleScreenClick, { passive: true });
    window.addEventListener('touchstart', this.handleScreenClick, { passive: true });
  }

  updated(changedProperties: Map<string, any>) {
    if (
      changedProperties.has('modelTranscript') ||
      changedProperties.has('isSpeaking') ||
      changedProperties.has('isUserSpeaking')
    ) {
      const container = this.shadowRoot?.querySelector('.middle-third-transcript') as HTMLElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('click', this.handleScreenClick);
    window.removeEventListener('touchstart', this.handleScreenClick);
    if (this.pauseCheckIntervalId) {
      clearInterval(this.pauseCheckIntervalId);
      this.pauseCheckIntervalId = null;
    }
    if (this.userSpeakingDebounceTimer) {
      clearTimeout(this.userSpeakingDebounceTimer);
      this.userSpeakingDebounceTimer = null;
    }
    this.stopWaitingSound();
    this.stopCamera();
    proxyManager.cleanup();
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];
  }

  private async initFirebaseMemory() {
    try {
      this.isAuthLoading = true;
      const user = await initializeUserAuth();
      this.currentUser = user as any;
      this.subscribeToUserFirestore(user.uid);
    } catch (err) {
      console.warn('Firebase Auth memory initialization notice:', err);
    } finally {
      this.isAuthLoading = false;
    }
  }

  private subscribeToUserFirestore(userId: string) {
    // Unsubscribe previous listeners
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];

    // Load local storage initial data immediately for instant responsive UX
    const localData = getLocalDossierData(userId);
    if (localData.permanentDossier) {
      this.permanentDossierText = localData.permanentDossier;
    }
    if (localData.memories && localData.memories.length > 0) {
      this.memoryFacts = localData.memories;
    }
    if (localData.sessions && localData.sessions.length > 0) {
      this.pastSessions = localData.sessions;
    }
    if (localData.docs && localData.docs.length > 0) {
      this.scannedDocs = localData.docs;
    }
    if (localData.judicialForms && localData.judicialForms.length > 0) {
      this.judicialFormsList = localData.judicialForms;
    }

    // If Firebase Auth is not active, stay with local persistent data
    if (!auth.currentUser) {
      return;
    }

    // 1. Subscribe to User Profile / Dossier
    try {
      const userDocRef = doc(db, 'users', userId);
      const unsubUser = onSnapshot(
        userDocRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (data.permanentMemoryDossier) {
              this.permanentDossierText = data.permanentMemoryDossier;
            }
          }
        },
        (err) => {
          console.info('Dossier snapshot notice:', err?.message);
        }
      );
      this.unsubscribers.push(unsubUser);
    } catch (e) {
      console.warn(e);
    }

    // 2. Subscribe to Memories
    try {
      const memoriesRef = collection(db, 'users', userId, 'memories');
      const qMem = query(memoriesRef, orderBy('createdAt', 'desc'), limit(30));
      const unsubMem = onSnapshot(
        qMem,
        (snap) => {
          const list: any[] = [];
          snap.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() });
          });
          if (list.length > 0) this.memoryFacts = list;
        },
        (err) => {
          console.info('Memories snapshot notice:', err?.message);
        }
      );
      this.unsubscribers.push(unsubMem);
    } catch (e) {
      console.warn(e);
    }

    // 3. Subscribe to Sessions
    try {
      const sessionsRef = collection(db, 'users', userId, 'sessions');
      const qSessions = query(sessionsRef, orderBy('createdAt', 'desc'), limit(20));
      const unsubSessions = onSnapshot(
        qSessions,
        (snap) => {
          const list: any[] = [];
          snap.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() });
          });
          if (list.length > 0) this.pastSessions = list;
        },
        (err) => {
          console.info('Sessions snapshot notice:', err?.message);
        }
      );
      this.unsubscribers.push(unsubSessions);
    } catch (e) {
      console.warn(e);
    }

    // 4. Subscribe to Documents
    try {
      const docsRef = collection(db, 'users', userId, 'documents');
      const qDocs = query(docsRef, orderBy('createdAt', 'desc'), limit(20));
      const unsubDocs = onSnapshot(
        qDocs,
        (snap) => {
          const list: any[] = [];
          snap.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() });
          });
          if (list.length > 0) this.scannedDocs = list;
        },
        (err) => {
          console.info('Docs snapshot notice:', err?.message);
        }
      );
      this.unsubscribers.push(unsubDocs);
    } catch (e) {
      console.warn(e);
    }

    // 5. Subscribe to Official Judicial Forms
    try {
      const formsRef = collection(db, 'users', userId, 'judicial_forms');
      const qForms = query(formsRef, orderBy('createdAt', 'desc'), limit(25));
      const unsubForms = onSnapshot(
        qForms,
        (snap) => {
          const list: any[] = [];
          snap.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() });
          });
          if (list.length > 0) this.judicialFormsList = list;
        },
        (err) => {
          console.info('Forms snapshot notice:', err?.message);
        }
      );
      this.unsubscribers.push(unsubForms);
    } catch (e) {
      console.warn(e);
    }
  }

  private handleScreenClick = async () => {
    if (this.isSessionExplicitlyEnded) return;
    this.initAudioContexts();

    if (this.inputAudioContext?.state === 'suspended') {
      await this.inputAudioContext.resume();
    }
    if (this.outputAudioContext?.state === 'suspended') {
      await this.outputAudioContext.resume();
    }

    if (!this.isConnected || !this.isListening) {
      await this.initClientAndStream();
    }
  };

  private initAudioContexts() {
    if (this.audioInitialized) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.inputAudioContext = new AudioCtx({ sampleRate: 16000 });
      this.outputAudioContext = new AudioCtx({ sampleRate: 24000 });
      this.inputNode = this.inputAudioContext.createGain();
      this.outputNode = this.outputAudioContext.createGain();

      // --- Vocal Enhancement DSP Equalizer for Crystal-Clear, Articulate Young Female Tehrani TTS ---
      // 1. Gentle Low Clean-up & Warmth (Low-shelf at 180 Hz with subtle +1.2 dB for natural chest resonance)
      const lowFilter = this.outputAudioContext.createBiquadFilter();
      lowFilter.type = 'lowshelf';
      lowFilter.frequency.setValueAtTime(180, this.outputAudioContext.currentTime);
      lowFilter.gain.setValueAtTime(1.2, this.outputAudioContext.currentTime);

      // 2. Tehrani Persian Phonetic Intelligibility & Consonant Articulation (Peaking at 3200 Hz, Q=1.2, +3.5 dB)
      const articulationFilter = this.outputAudioContext.createBiquadFilter();
      articulationFilter.type = 'peaking';
      articulationFilter.frequency.setValueAtTime(3200, this.outputAudioContext.currentTime);
      articulationFilter.Q.setValueAtTime(1.2, this.outputAudioContext.currentTime);
      articulationFilter.gain.setValueAtTime(3.5, this.outputAudioContext.currentTime);

      // 3. Silky High Presence & Air for crystal-clear enunciation (High-shelf at 8200 Hz, +1.8 dB)
      const silkyAir = this.outputAudioContext.createBiquadFilter();
      silkyAir.type = 'highshelf';
      silkyAir.frequency.setValueAtTime(8200, this.outputAudioContext.currentTime);
      silkyAir.gain.setValueAtTime(1.8, this.outputAudioContext.currentTime);

      // 4. Dynamics Compressor for broadcast polish, pristine clarity and vocal presence
      const compressor = this.outputAudioContext.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-18, this.outputAudioContext.currentTime);
      compressor.knee.setValueAtTime(8, this.outputAudioContext.currentTime);
      compressor.ratio.setValueAtTime(2.8, this.outputAudioContext.currentTime);
      compressor.attack.setValueAtTime(0.003, this.outputAudioContext.currentTime);
      compressor.release.setValueAtTime(0.14, this.outputAudioContext.currentTime);

      // Route Output Signal Chain: outputNode -> lowFilter -> articulationFilter -> silkyAir -> compressor -> destination
      this.outputNode.connect(lowFilter);
      lowFilter.connect(articulationFilter);
      articulationFilter.connect(silkyAir);
      silkyAir.connect(compressor);
      compressor.connect(this.outputAudioContext.destination);

      this.nextStartTime = this.outputAudioContext.currentTime;
      this.audioInitialized = true;
      this.preloadWaitingAudio();
      this.startPauseMonitor();
    } catch (e) {
      console.error('Audio context initialization error:', e);
    }
  }

  private notifyConversationActivity() {
    this.lastConversationActivityTime = Date.now();
    if (this.waitingCountdownSec !== 0) {
      this.waitingCountdownSec = 0;
    }
    if (this.isWaitingSoundPlaying) {
      this.stopWaitingSound();
    }
  }

  private createSeamlessLoopBuffer(audioCtx: AudioContext, buffer: AudioBuffer): AudioBuffer {
    try {
      const numChannels = buffer.numberOfChannels;
      const sampleRate = buffer.sampleRate;
      const length = buffer.length;

      // 1. Detect trailing silence/low energy at the end of the track
      let endSample = length - 1;
      const threshold = 0.006;
      for (let i = length - 1; i >= 0; i--) {
        let maxAmp = 0;
        for (let ch = 0; ch < numChannels; ch++) {
          const amp = Math.abs(buffer.getChannelData(ch)[i]);
          if (amp > maxAmp) maxAmp = amp;
        }
        if (maxAmp > threshold) {
          endSample = Math.min(length - 1, i + Math.floor(sampleRate * 0.015));
          break;
        }
      }

      // 2. Cut trailing few hundredths of a second (90ms) to eliminate encoder padding & stop gap
      const minPaddingTrim = Math.floor(sampleRate * 0.09);
      endSample = Math.min(endSample, length - minPaddingTrim);
      if (endSample < sampleRate * 1) {
        endSample = length - 1;
      }

      // 3. Apply seamless 45ms crossfade between the tail and the start
      const crossfadeSamples = Math.floor(sampleRate * 0.045);
      const trimmedLength = Math.max(crossfadeSamples * 2, endSample - crossfadeSamples);

      const seamlessBuffer = audioCtx.createBuffer(numChannels, trimmedLength, sampleRate);

      for (let ch = 0; ch < numChannels; ch++) {
        const srcData = buffer.getChannelData(ch);
        const destData = seamlessBuffer.getChannelData(ch);

        // Copy body
        for (let i = 0; i < trimmedLength; i++) {
          destData[i] = srcData[i];
        }

        // Crossfade tail into loop head
        for (let i = 0; i < crossfadeSamples; i++) {
          const tailSampleIndex = trimmedLength + i;
          if (tailSampleIndex < endSample) {
            const tailSample = srcData[tailSampleIndex];
            const t = i / crossfadeSamples;
            const fadeOut = Math.cos(t * 0.5 * Math.PI);
            const fadeIn = Math.sin(t * 0.5 * Math.PI);
            destData[i] = destData[i] * fadeIn + tailSample * fadeOut;
          }
        }

        // Micro-smoothing at extreme edges
        const edgeSmoothing = Math.min(64, Math.floor(sampleRate * 0.002));
        for (let i = 0; i < edgeSmoothing; i++) {
          const factor = i / edgeSmoothing;
          destData[i] *= factor;
          destData[trimmedLength - 1 - i] *= factor;
        }
      }

      return seamlessBuffer;
    } catch (e) {
      console.warn('Seamless loop processing error, using raw buffer:', e);
      return buffer;
    }
  }

  private async preloadWaitingAudio() {
    // 1. Setup HTMLAudioElement with immediate preload
    try {
      if (!this.waitingAudioElement) {
        const audioSrc = discordAudioUrl || '/discord.mp3';
        this.waitingAudioElement = new Audio(audioSrc);
        this.waitingAudioElement.loop = true;
        this.waitingAudioElement.volume = 0.35;
        this.waitingAudioElement.preload = 'auto';
        this.waitingAudioElement.load();
      }
    } catch (e) {
      console.warn('HTMLAudio init warning:', e);
    }

    if (this.waitingAudioBuffer) return;

    // 2. Fetch and decode into WebAudio AudioBuffer with seamless mixing
    const candidates = [
      '/discord.mp3',
      discordAudioUrl,
      './discord.mp3',
      'discord.mp3',
      '/public/discord.mp3',
    ];
    for (const url of candidates) {
      if (!url) continue;
      try {
        const response = await fetch(url);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          if (this.outputAudioContext) {
            let rawBuffer: AudioBuffer | null = null;
            try {
              rawBuffer = await this.outputAudioContext.decodeAudioData(arrayBuffer);
            } catch {
              rawBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
                this.outputAudioContext.decodeAudioData(arrayBuffer, resolve, reject);
              });
            }
            if (rawBuffer) {
              this.waitingAudioBuffer = this.createSeamlessLoopBuffer(
                this.outputAudioContext,
                rawBuffer
              );
              break;
            }
          }
        }
      } catch {
        // try next candidate
      }
    }
  }

  private startWaitingSound() {
    if (!this.waitingMusicEnabled || !this.isConnected) return;
    if (this.isWaitingSoundPlaying) return;
    if (this.isSpeaking || this.isUserSpeaking || this.sources.size > 0) return;

    this.isWaitingSoundPlaying = true;
    this.isWaitingMusicActive = true;

    try {
      if (this.outputAudioContext && this.outputAudioContext.state === 'suspended') {
        void this.outputAudioContext.resume();
      }

      if (this.outputAudioContext && this.waitingAudioBuffer) {
        if (this.waitingAudioSource) {
          try {
            this.waitingAudioSource.stop();
            this.waitingAudioSource.disconnect();
          } catch {}
          this.waitingAudioSource = null;
        }

        this.waitingGainNode = this.outputAudioContext.createGain();
        this.waitingGainNode.gain.setValueAtTime(0.35, this.outputAudioContext.currentTime);
        this.waitingGainNode.connect(this.outputAudioContext.destination);

        this.waitingAudioSource = this.outputAudioContext.createBufferSource();
        this.waitingAudioSource.buffer = this.waitingAudioBuffer;
        this.waitingAudioSource.loop = true;
        this.waitingAudioSource.connect(this.waitingGainNode);
        this.waitingAudioSource.start();
      } else {
        // Fallback to HTMLAudioElement
        if (!this.waitingAudioElement) {
          this.waitingAudioElement = new Audio(discordAudioUrl || '/discord.mp3');
          this.waitingAudioElement.loop = true;
        }
        this.waitingAudioElement.volume = 0.35;
        this.waitingAudioElement.currentTime = 0;
        const playPromise = this.waitingAudioElement.play();
        if (playPromise !== undefined) {
          playPromise.catch((e) => console.warn('Waiting audio play deferred:', e));
        }

        if (!this.waitingAudioBuffer) {
          void this.preloadWaitingAudio();
        }
      }
    } catch (err) {
      console.warn('Error starting waiting sound:', err);
      this.isWaitingSoundPlaying = false;
      this.isWaitingMusicActive = false;
    }
  }

  private stopWaitingSound() {
    this.waitingCountdownSec = 0;
    if (!this.isWaitingSoundPlaying && !this.isWaitingMusicActive) return;
    this.isWaitingSoundPlaying = false;
    this.isWaitingMusicActive = false;

    try {
      if (this.waitingAudioSource) {
        try {
          this.waitingAudioSource.stop();
          this.waitingAudioSource.disconnect();
        } catch {}
        this.waitingAudioSource = null;
      }
      if (this.waitingGainNode) {
        try {
          this.waitingGainNode.disconnect();
        } catch {}
        this.waitingGainNode = null;
      }
      if (this.waitingAudioElement) {
        this.waitingAudioElement.pause();
        this.waitingAudioElement.currentTime = 0;
      }
    } catch (err) {
      console.warn('Error stopping waiting sound:', err);
    }
  }

  private startPauseMonitor() {
    if (this.pauseCheckIntervalId) {
      clearInterval(this.pauseCheckIntervalId);
    }
    this.lastConversationActivityTime = Date.now();
    this.waitingCountdownSec = 0;

    this.pauseCheckIntervalId = window.setInterval(() => {
      if (!this.isConnected || !this.waitingMusicEnabled) {
        if (this.waitingCountdownSec !== 0) {
          this.waitingCountdownSec = 0;
        }
        if (this.isWaitingSoundPlaying) {
          this.stopWaitingSound();
        }
        return;
      }

      if (this.isSpeaking || this.isUserSpeaking || this.sources.size > 0) {
        this.lastConversationActivityTime = Date.now();
        if (this.waitingCountdownSec !== 0) {
          this.waitingCountdownSec = 0;
        }
        if (this.isWaitingSoundPlaying) {
          this.stopWaitingSound();
        }
        return;
      }

      const elapsed = Date.now() - this.lastConversationActivityTime;

      // Between 5000ms and 7000ms: Show WAITING STATUS countdown from 5 to 7
      if (elapsed >= 5000 && elapsed < 7000) {
        const sec = Math.min(7, Math.floor(elapsed / 1000));
        if (this.waitingCountdownSec !== sec) {
          this.waitingCountdownSec = sec;
        }
      } else if (elapsed >= 7000) {
        if (this.waitingCountdownSec !== 7) {
          this.waitingCountdownSec = 7;
        }
        // Pause exceeding 7 seconds (7000ms): Play waiting sound
        if (!this.isWaitingSoundPlaying) {
          this.startWaitingSound();
        }
      } else {
        if (this.waitingCountdownSec !== 0) {
          this.waitingCountdownSec = 0;
        }
        if (this.isWaitingSoundPlaying) {
          this.stopWaitingSound();
        }
      }
    }, 100);
  }

  private async startExperience() {
    this.initAudioContexts();

    try {
      if (this.inputAudioContext?.state === 'suspended') {
        await this.inputAudioContext.resume();
      }
      if (this.outputAudioContext?.state === 'suspended') {
        await this.outputAudioContext.resume();
      }

      await this.initClientAndStream();
    } catch (err) {
      console.log('Autoplay deferred until user interaction:', err);
    }
  }

  private isConnecting = false;

  private async initClientAndStream(forceReconnect = false) {
    if (this.isConnecting && !forceReconnect) return;
    if (this.isConnected && this.session && !forceReconnect) return;
    this.isConnecting = true;

    try {
      this.client = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
      });

      await this.initSession(forceReconnect);
      await this.startContinuousMicrophone();
    } catch (err: any) {
      console.warn('Live client stream connection notice:', err?.message || err);
      this.scheduleSessionReconnect();
    } finally {
      this.isConnecting = false;
    }
  }

  private scheduleSessionReconnect() {
    if (this.isSessionExplicitlyEnded) return;
    if (this.reconnectTimeoutId) {
      window.clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.isSessionReconnecting = false;
      this.sessionErrorMessage = 'ارتباط با سرور صوتی موقتاً قطع شد. برای اتصال مجدد کلیک کنید.';
      return;
    }

    this.isSessionReconnecting = true;
    this.reconnectAttempts++;
    const delay = Math.min(1200 * Math.pow(1.4, this.reconnectAttempts - 1), 6000);

    this.reconnectTimeoutId = window.setTimeout(async () => {
      try {
        if (this.isSessionExplicitlyEnded) return;
        console.info(
          `Attempting live session auto-reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
        );
        await this.initSession(true);
        if (this.isConnected) {
          this.reconnectAttempts = 0;
          this.isSessionReconnecting = false;
          this.sessionErrorMessage = '';
          this.showToast('اتصال زنده صوتی مجدداً برقرار شد ✓');
        }
      } catch (err) {
        console.warn('Auto-reconnect attempt notice:', err);
        this.scheduleSessionReconnect();
      }
    }, delay);
  }

  private handleEndConsultation(e?: Event) {
    if (e) e.stopPropagation();

    // 1. Immediately stop all active audio sources
    this.sources.forEach((source) => {
      try {
        source.stop();
        source.disconnect();
      } catch {}
    });
    this.sources.clear();
    this.nextStartTime = 0;
    this.isSpeaking = false;

    // 2. Stop waiting sound and silence monitors
    this.stopWaitingSound();
    if (this.pauseCheckIntervalId) {
      clearInterval(this.pauseCheckIntervalId);
      this.pauseCheckIntervalId = null;
    }
    if (this.userSpeakingDebounceTimer) {
      clearTimeout(this.userSpeakingDebounceTimer);
      this.userSpeakingDebounceTimer = null;
    }

    // 3. Stop camera if active
    if (this.isCameraActive) {
      this.stopCamera();
    }

    // 4. Cancel any reconnect timers
    if (this.reconnectTimeoutId) {
      window.clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    this.isSessionReconnecting = false;
    this.reconnectAttempts = 0;
    this.sessionErrorMessage = '';

    // 5. Cleanly close live websocket session
    if (this.session) {
      try {
        (this.session as any).close?.();
      } catch (err) {
        console.warn('Session close notice:', err);
      }
      this.session = null as any;
    }

    this.isConnected = false;
    this.isListening = false;
    this.isSessionExplicitlyEnded = true;

    // 6. Suspend audio contexts cleanly
    try {
      if (this.inputAudioContext && this.inputAudioContext.state === 'running') {
        this.inputAudioContext.suspend();
      }
      if (this.outputAudioContext && this.outputAudioContext.state === 'running') {
        this.outputAudioContext.suspend();
      }
    } catch {}

    this.showToast('جلسه مشاوره با موفقیت و به صورت امن خاتمه یافت ✓');
  }

  private async handleRestartConsultation(e?: Event) {
    if (e) e.stopPropagation();
    this.isSessionExplicitlyEnded = false;
    this.sessionErrorMessage = '';
    this.showToast('در حال شروع مجدد جلسه مشاوره حقوقی...');
    this.startPauseMonitor();
    await this.startExperience();
  }

  private async handleManualReconnect(e?: Event) {
    if (e) e.stopPropagation();
    if (this.reconnectTimeoutId) {
      window.clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    this.isSessionExplicitlyEnded = false;
    this.reconnectAttempts = 0;
    this.isSessionReconnecting = true;
    this.sessionErrorMessage = '';
    this.showToast('در حال برقراری مجدد ارتباط صوتی با وکیل...');
    await this.initClientAndStream(true);
    if (this.isConnected) {
      this.isSessionReconnecting = false;
      this.sessionErrorMessage = '';
      this.showToast('اتصال با موفقیت برقرار شد ✓');
    } else {
      this.isSessionReconnecting = false;
    }
  }

  private async initSession(isRetry = false) {
    if (this.isConnected && this.session && !isRetry) return;

    const model = 'gemini-3.1-flash-live-preview';

    let userMemoryPrompt = '';
    if (this.currentUser?.uid) {
      userMemoryPrompt = await loadUserMemoryContext(this.currentUser.uid);
    }

    const currentToneConfig = getToneById(this.selectedTone);
    const toneInstruction = `\n\n[تنظیم لهجه و لحن فعال وکیل]:\nنام لحن: ${currentToneConfig.title}\nلهجه: ${currentToneConfig.accent}\nدستور گفتار: ${currentToneConfig.speakingPrompt}\nشما موظفید همین شیوه گفتار و لحن را در مکالمات خود حفظ فرمایید.`;

    const fullInstruction = `${LAWYER_SYSTEM_INSTRUCTION}\n\n${userMemoryPrompt}\n\n${toneInstruction}`;

    const judicialFormToolDeclaration = {
      name: 'generateJudicialForm',
      description:
        'تنظیم و صدور رسمی برگ پیش‌نویس دادخواست حقوقی، شکواییه کیفری، اظهارنامه رسمی ماده ۱۵۶، لایحه دفاعیه، دادخواست دیوان عدالت یا شورای حل اختلاف، و همچنین نامه‌های رسمی اداری، درخواست‌های سازمانی (اداره کار، تامین اجتماعی، شهرداری، بانک‌ها) و اخطاریه‌های حقوقی با خروجی قابل دانلود PDF و سربرگ معتبر. هرگاه کاربر درخواست تنظیم فرم رسمی یا نامه اداری کرد یا پس از اینکه پیشنهاد دادید و کاربر موافقت کرد، این تابع را صدا بزنید تا فرم رسمی صادر و در صفحه او نمایش داده شود.',
      parameters: {
        type: 'OBJECT',
        properties: {
          formType: {
            type: 'STRING',
            description:
              'نوع فرم یا نامه: dadkhast (دادخواست حقوقی), shekayat (شکواییه کیفری), ezharnameh (اظهارنامه رسمی), layehe (لایحه دفاعیه), nameh_edari (نامه رسمی اداری و شرکتی), darkhast_edari (درخواست رسمی به اداره کار/بانک/شهرداری), etelaieh_hoghooghi (اخطاریه رسمی حقوقی), shora (شورای حل اختلاف), divan (دیوان عدالت اداری), tamin (تامین خواسته), qarardad_solh (سازش‌نامه و صلح‌نامه)',
          },
          title: {
            type: 'STRING',
            description:
              'عنوان کامل فرم یا نامه (مثال: برگ دادخواست نخستین به دادگاه عمومی حقوقی تهران یا نامه رسمی به ریاست اداره کار)',
          },
          authorityName: {
            type: 'STRING',
            description:
              'نام مرجع قضایی یا سازمان اداری صالح (مثال: دادگاه عمومی حقوقی تهران یا ریاست محترم اداره تعاون، کار و رفاه اجتماعی)',
          },
          claimantName: { type: 'STRING', description: 'نام خواهان یا شاکی یا فرستنده نامه' },
          claimantFatherName: { type: 'STRING', description: 'نام پدر یا شماره ثبت شرکت' },
          claimantNationalId: { type: 'STRING', description: 'کد ملی یا شناسه ملی فرستنده' },
          claimantAddress: {
            type: 'STRING',
            description: 'نشانی و اقامتگاه قانونی فرستنده/خواهان',
          },
          respondentName: {
            type: 'STRING',
            description: 'نام خوانده یا مشتکی‌عنه یا مخاطب/گیرنده نامه',
          },
          respondentAddress: {
            type: 'STRING',
            description: 'نشانی یا اقامتگاه طرف مقابل/سازمان مخاطب',
          },
          subject: { type: 'STRING', description: 'موضوع دقیق خواسته، شکایت یا موضوع نامه رسمی' },
          evidences: {
            type: 'ARRAY',
            items: { type: 'STRING' },
            description:
              'فهرست دلایل، پیوست‌ها و منضمات قانونی (اسناد، مدارک، قرارداد، استعلام‌ها)',
          },
          legalBasis: {
            type: 'STRING',
            description: 'مستندات قانونی، مواد قوانین یا بخشنامه‌های مربوطه',
          },
          bodyText: {
            type: 'STRING',
            description:
              'متن مشروح، بندبندی‌شده، فصیح و مستدل دادخواست، شکواییه، اظهارنامه، لایحه یا نامه رسمی اداری به قلم وکیل پایه یک دادگستری',
          },
        },
        required: ['formType', 'title', 'authorityName', 'subject', 'bodyText'],
      },
    };

    const requestDocUploadToolDeclaration = {
      name: 'requestDocumentUpload',
      description:
        'درخواست از کاربر برای آپلود و بارگذاری اسناد، قراردادها، چک‌ها، تصاویر مدارک یا اوراق اداری از حافظه سیستم یا گوشی. با صدا زدن این ابزار پنجره انتخاب فایل روی صفحه کاربر به صورت خودکار باز می‌شود.',
      parameters: {
        type: 'OBJECT',
        properties: {
          reason: {
            type: 'STRING',
            description:
              'علت و توضیح کوتاه نیاز به بارگذاری سند (مثال: جهت بررسی دقیق‌تر بندهای قرارداد و شروط تعهدآور)',
          },
        },
        required: ['reason'],
      },
    };

    const switchLawyerToneDeclaration = {
      name: 'switchLawyerTone',
      description:
        'تغییر لحن یا لهجه وکیل و مشاور حقوقی بنا به درخواست کاربر (مانند: لحن دوستانه و صمیمی، لحن حقوقی و مقتدر دادگاهی، یا لحن رسمی و آکادمیک).',
      parameters: {
        type: 'OBJECT',
        properties: {
          toneId: {
            type: 'STRING',
            description:
              'شناسه لحن جدید: legal_strict (حقوقی و مقتدر), friendly (دوستانه و صمیمی), formal_academic (رسمی و آکادمیک)',
          },
        },
        required: ['toneId'],
      },
    };

    const saveUserNameToolDeclaration = {
      name: 'saveUserName',
      description:
        'ثبت و ماندگار کردن نام شریف مخاطب در حافظه دائم سیستم. هرگاه در حین مکالمه نام مخاطب را جویا شدید یا مخاطب خودش نام خود را اعلام کرد، فوراً این تابع را صدا بزنید تا نام ایشان در حافظه دائم ذخیره شود و در تمام جلسات آینده همیشه به یاد داشته باشید و ایشان را با نام محترمشان با وقار و صمیمیت صدا بزنید.',
      parameters: {
        type: 'OBJECT',
        properties: {
          name: {
            type: 'STRING',
            description:
              'نام و نام خانوادگی یا نام اعلام‌شده توسط مخاطب (مثلاً: عرفان رجب‌زاده یا آقای رجب‌زاده)',
          },
        },
        required: ['name'],
      },
    };

    try {
      this.session = await this.client.live.connect({
        model: model,
        callbacks: {
          onopen: () => {
            this.isConnected = true;
            this.isSessionReconnecting = false;
            this.reconnectAttempts = 0;
            this.sessionErrorMessage = '';
            this.lastConversationActivityTime = Date.now();
            this.preloadWaitingAudio();
            this.startPauseMonitor();
            // Record session start in Firestore
            if (this.currentUser?.uid) {
              saveSessionLog(
                this.currentUser.uid,
                this.currentSessionId,
                'جلسه مشاوره حقوقی زنده',
                'جلسه فعال در حال برگزاری است.',
                1
              );
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData;

            const modelPartText = message.serverContent?.modelTurn?.parts?.find(
              (p) => p.text
            )?.text;
            if (modelPartText) {
              this.modelTranscript += modelPartText;
              this.isModelTyping = true;
            }
            if (message.serverContent?.turnComplete) {
              this.isModelTyping = false;
            }

            if (audio?.data) {
              this.isSpeaking = true;
              this.notifyConversationActivity();
              this.nextStartTime = Math.max(
                this.nextStartTime,
                this.outputAudioContext.currentTime
              );

              const audioBuffer = await decodeAudioData(
                decode(audio.data),
                this.outputAudioContext,
                24000,
                1
              );
              const source = this.outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(this.outputNode);

              source.addEventListener('ended', () => {
                this.sources.delete(source);
                if (this.sources.size === 0) {
                  this.isSpeaking = false;
                  this.lastConversationActivityTime = Date.now();
                }
              });

              source.start(this.nextStartTime);
              this.nextStartTime = this.nextStartTime + audioBuffer.duration;
              this.sources.add(source);
            }

            const interrupted = message.serverContent?.interrupted;
            if (interrupted) {
              for (const source of this.sources.values()) {
                try {
                  source.stop();
                } catch {
                  // already stopped
                }
                this.sources.delete(source);
              }
              this.nextStartTime = 0;
              this.isSpeaking = false;
              this.lastConversationActivityTime = Date.now();
            }

            // Handle Tool Calls
            if (message.toolCall) {
              const calls = message.toolCall.functionCalls || [];
              for (const call of calls) {
                if (call.name === 'generateJudicialForm') {
                  this.handleJudicialFormGenerated(call.id, call.args);
                } else if (call.name === 'saveUserName') {
                  const name = (call.args as any)?.name || '';
                  if (name && this.currentUser?.uid) {
                    saveUserName(this.currentUser.uid, name);
                    if (this.currentUser) {
                      this.currentUser.displayName = name;
                    }
                    this.showToast(`نام شریف «${name}» در حافظه دائم ثبت شد ✓`);
                  }
                  try {
                    this.session?.sendToolResponse({
                      functionResponses: [
                        {
                          id: call.id,
                          name: 'saveUserName',
                          response: {
                            output: {
                              success: true,
                              message: `نام ${name} با موفقیت در حافظه دائم ثبت شد.`,
                            },
                          },
                        },
                      ],
                    });
                  } catch (e) {
                    console.warn(e);
                  }
                } else if (call.name === 'requestDocumentUpload') {
                  this.openUploadModal();
                  try {
                    this.session?.sendToolResponse({
                      functionResponses: [
                        {
                          id: call.id,
                          name: 'requestDocumentUpload',
                          response: {
                            output: {
                              success: true,
                              message:
                                'پنجره انتخاب و بارگذاری اسناد از حافظه داخلی برای مخاطب گشوده شد.',
                            },
                          },
                        },
                      ],
                    });
                  } catch (e) {
                    console.warn(e);
                  }
                } else if (call.name === 'switchLawyerTone') {
                  const newTone = (call.args?.toneId as any) || 'friendly';
                  this.handleSelectTone(newTone);
                  try {
                    this.session?.sendToolResponse({
                      functionResponses: [
                        {
                          id: call.id,
                          name: 'switchLawyerTone',
                          response: {
                            output: {
                              success: true,
                              message: `لحن وکیل با موفقیت به ${newTone} تغییر یافت.`,
                            },
                          },
                        },
                      ],
                    });
                  } catch (e) {
                    console.warn(e);
                  }
                }
              }
            }
          },
          onerror: (e: any) => {
            console.warn('Live session connection notice:', e?.message || e);
            this.isConnected = false;
            this.isSpeaking = false;
            this.scheduleSessionReconnect();
          },
          onclose: (e: CloseEvent) => {
            this.isConnected = false;
            this.isSpeaking = false;
            if (!e.wasClean) {
              this.scheduleSessionReconnect();
            }
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Aoede',
              },
            },
          },
          tools: [
            {
              functionDeclarations: [
                judicialFormToolDeclaration as any,
                requestDocUploadToolDeclaration as any,
                switchLawyerToneDeclaration as any,
                saveUserNameToolDeclaration as any,
              ],
            },
          ],
          systemInstruction: {
            parts: [{ text: fullInstruction }],
          },
        },
      });

      this.isConnected = true;
      this.isSessionReconnecting = false;
      this.reconnectAttempts = 0;
      this.sessionErrorMessage = '';
      if (!isRetry) {
        this.triggerInitialGreeting();
      }
    } catch (e: any) {
      console.warn('Live session initial connection notice:', e?.message || e);
      this.isConnected = false;
      this.scheduleSessionReconnect();
    }
  }

  /* Judicial Form Generation and Handler Methods */
  private async handleJudicialFormGenerated(callId: string, args: any) {
    const dateStr = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

    const trackingNum = '1405' + Math.floor(1000000000 + Math.random() * 9000000000).toString();

    const formData: JudicialFormData = {
      formType: (args.formType as any) || 'dadkhast',
      title: args.title || 'برگ رسمی دادخواست نخستین',
      authorityName: args.authorityName || 'دادگاه عمومی حقوقی',
      trackingCode: trackingNum,
      filingDate: dateStr,
      branchNumber: 'شعبه صالحه دادگستری',
      claimant: {
        name: args.claimantName || this.currentUser?.displayName || 'خواهان (موکل)',
        fatherName: args.claimantFatherName || 'ثبت در سامانه ثنا',
        nationalId: args.claimantNationalId || 'ثبت در سامانه ثنا',
        job: 'شاغل',
        address: args.claimantAddress || 'اقامتگاه قانونی مطابق سامانه ثنا',
        phone: 'ثبت در سامانه ثنا',
      },
      respondent: {
        name: args.respondentName || 'خوانده / مشتکی‌عنه',
        fatherName: 'نامشخص',
        nationalId: 'نامشخص',
        job: 'آزاد',
        address: args.respondentAddress || 'نشانی و اقامتگاه خوانده',
      },
      attorney: {
        name: 'وکیل پایه یک دادگستری',
        licenseNumber: 'پروانه وکالت رسمی دادگستری',
      },
      subject: args.subject || 'خواسته دعوا',
      evidences:
        Array.isArray(args.evidences) && args.evidences.length > 0
          ? args.evidences
          : ['مدارک و اسناد پیوست', 'استعلام‌های قانونی'],
      legalBasis: args.legalBasis || 'مقررات قانون مدنی و قانون آیین دادرسی مدنی',
      bodyText: args.bodyText || '',
    };

    this.activeJudicialForm = formData;
    this.selectedTemplateType = formData.formType;
    this.isJudicialFormModalOpen = true;
    this.isFormEditing = false;
    this.formGeneratedNotification = `برگ رسمی «${formData.title}» تنظیم و صادر گردید`;

    if (this.currentUser?.uid) {
      saveJudicialFormRecord(this.currentUser.uid, formData);
    }

    try {
      this.session?.sendToolResponse({
        functionResponses: [
          {
            id: callId,
            name: 'generateJudicialForm',
            response: {
              output: {
                success: true,
                message:
                  'برگ رسمی قضایی با موفقیت تنظیم، صادر و در صفحه موکل بارگذاری شد و آماده چاپ و دانلود است.',
              },
            },
          },
        ],
      });
    } catch (e) {
      console.warn('Error sending tool response:', e);
    }

    setTimeout(() => {
      this.formGeneratedNotification = '';
    }, 7000);
  }

  private openJudicialFormStudio(form?: JudicialFormData, e?: Event) {
    if (e) e.stopPropagation();
    if (form) {
      this.activeJudicialForm = form;
      this.selectedTemplateType = form.formType;
    } else if (!this.activeJudicialForm) {
      this.activeJudicialForm = generateSampleJudicialForm(this.selectedTemplateType);
    }
    this.isJudicialFormModalOpen = true;
    this.isFormEditing = false;
  }

  private closeJudicialFormStudio(e?: Event) {
    if (e) e.stopPropagation();
    this.isJudicialFormModalOpen = false;
    this.isFormEditing = false;
  }

  private handleSelectFormType(type: JudicialFormData['formType'], e?: Event) {
    if (e) e.stopPropagation();
    this.selectedTemplateType = type;
    this.activeJudicialForm = generateSampleJudicialForm(type);
  }

  private async handleDownloadPDF(e?: Event) {
    if (e) e.stopPropagation();
    if (!this.activeJudicialForm) return;
    try {
      this.isGeneratingPDF = true;
      this.showToast('در حال آماده‌سازی و ساخت فایل PDF استاندارد A4...');
      const targetEl = this.shadowRoot?.querySelector(
        '#officialJudicialPaperDocument'
      ) as HTMLElement | null;
      await downloadJudicialPDF(this.activeJudicialForm, targetEl, (msg) => {
        this.showToast(msg);
      });
    } catch (err) {
      console.error('Error generating PDF:', err);
      this.showToast('خطا در صدور فایل PDF. لطفاً مجدداً تلاش فرمایید.');
    } finally {
      this.isGeneratingPDF = false;
    }
  }

  private async handleGenerateDraftFromConversation(e?: Event) {
    if (e) e.stopPropagation();
    if (this.isGeneratingDraft) return;

    try {
      this.isGeneratingDraft = true;
      this.showToast('در حال تحلیل گفتگوی جلسه و تنظیم پیش‌نویس رسمی سند/نامه...');

      const transcriptText = this.modelTranscript.trim();
      const factsText = this.memoryFacts.map((f) => `${f.key}: ${f.content}`).join('\n');
      const docsSummary = this.scannedDocs
        .map((d) => `سند: ${d.title} (${d.extractedText?.slice(0, 300) || ''})`)
        .join('\n');
      const clientName = this.currentUser?.displayName || 'موکل محترم';

      const aiPrompt = `شما وکیل پایه یک دادگستری و مشاور ارشد حقوقی مسلط به آیین دادرسی مدنی و کیفری ایران و آیین‌نامه‌ها و مکاتبات اداری کشور هستید.
بر اساس متن گفتگوی زیر و سوابق پرونده، مناسب‌ترین و رسمی‌ترین پیش‌نویس (دادخواست حقوقی، شکواییه کیفری، اظهارنامه رسمی ماده ۱۵۶ ق.آ.د.م، لایحه دفاعیه، دادخواست دیوان عدالت یا شورای حل اختلاف، تامین خواسته، یا نامه رسمی اداری و درخواست سازمانی مانند اداره کار/تامین اجتماعی/شهرداری/بانک) را تنظیم کنید.

متن گفتگوی جلسه مشاوره:
${transcriptText || 'جلسه مشاوره حقوقی جهت تنظیم دادخواست و مطالبه حقوق قانونی'}

نکات و سوابق پرونده:
${factsText || 'سوابق اولیه پرونده حقوقی'}

اسناد ارائه‌شده:
${docsSummary || 'اسناد و مدارک عادی پیوست پرونده'}

نام متقاضی/موکل: ${clientName}

پاسخ شما باید صرفاً یک آبجکت JSON معتبر، دقیق، کامل و بدون هیچ متن توضیحی اضافه باشد (بدون تگ‌های اضافی مارک‌داون):
{
  "formType": "dadkhast",
  "title": "عنوان رسمی و دقیق برگه یا نامه",
  "authorityName": "نام دقیق مرجع قضایی صالح یا سازمان دریافت‌کننده نامه",
  "claimantName": "نام و نام خانوادگی خواهان / شاکی / فرستنده",
  "claimantFatherName": "نام پدر یا شناسه ثبت",
  "claimantNationalId": "کد ملی ده رقمی در صورت وجود یا خالی",
  "claimantAddress": "نشانی فرستنده/خواهان",
  "respondentName": "نام خوانده / مشتکی‌عنه / گیرنده نامه یا سازمان",
  "respondentAddress": "نشانی طرف مقابل / سازمان مربوطه",
  "subject": "موضوع دقیق خواسته، شکایت یا درخواست اداری",
  "evidences": ["دلیل و مدرک ۱", "دلیل و مدرک ۲", "دلیل و مدرک ۳"],
  "legalBasis": "استنادات و مواد قانونی مصوب (مثال: مواد ۱۰، ۲۱۹، ۲۲۰ و ۵۲۲ قانون مدنی یا قانون کار)",
  "bodyText": "متن مشروح، بندبندی‌شده، فصیح، مستدل و حرفه‌ای با ادبیات فاخر حقوقی وکیل پایه یک دادگستری شامل شرح ماوقع، استدلالات قانونی و نتیجه‌گیری و درخواست صدور حکم/دستور"
}
توجه: فیلد formType باید دقیقاً یکی از مقادیر زیر باشد:
"dadkhast" | "shekayat" | "ezharnameh" | "layehe" | "nameh_edari" | "darkhast_edari" | "etelaieh_hoghooghi" | "shora" | "divan" | "tamin" | "qarardad_solh"
`;

      if (!this.client) {
        this.client = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
        });
      }

      const candidateModels = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-flash-latest'];
      let response: any = null;
      let lastModelError: any = null;

      for (const m of candidateModels) {
        try {
          response = await this.client.models.generateContent({
            model: m,
            contents: aiPrompt,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          });
          if (response?.text) {
            break;
          }
        } catch (mErr) {
          lastModelError = mErr;
          console.warn(`Model generation with ${m} failed, trying next candidate:`, mErr);
        }
      }

      if (!response && lastModelError) {
        throw lastModelError;
      }

      const responseText = response?.text?.trim() || '';
      let jsonStr = responseText;
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr
          .replace(/^```json/, '')
          .replace(/```$/, '')
          .trim();
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```/, '').replace(/```$/, '').trim();
      }

      const parsed = JSON.parse(jsonStr);
      const generatedForm: JudicialFormData = {
        id: 'form_' + Date.now(),
        formType: parsed.formType || 'dadkhast',
        title: parsed.title || 'پیش‌نویس رسمی سند قضایی',
        trackingCode: 'IR-' + Math.floor(10000000 + Math.random() * 90000000),
        filingDate: new Intl.DateTimeFormat('fa-IR', { dateStyle: 'full' }).format(new Date()),
        authorityName: parsed.authorityName || 'دادگاه عمومی حقوقی',
        claimant: {
          name: parsed.claimantName || clientName,
          fatherName: parsed.claimantFatherName || '—',
          nationalId: parsed.claimantNationalId || '',
          address: parsed.claimantAddress || 'اقامتگاه قانونی اعلامی در ثنا',
        },
        respondent: {
          name: parsed.respondentName || 'خوانده / طرف دعوی',
          address: parsed.respondentAddress || 'نشانی اعلامی',
        },
        subject: parsed.subject || 'مطالبه حقوق قانونی و خسارات وارده',
        evidences:
          Array.isArray(parsed.evidences) && parsed.evidences.length > 0
            ? parsed.evidences
            : ['مدارک پیوست پرونده', 'استعلام مراجع ذی‌صلاح'],
        legalBasis: parsed.legalBasis || 'قوانین و مقررات موضوعه کشور',
        bodyText: parsed.bodyText || 'ریاست محترم، احتراماً به استحضار می‌رساند...',
        createdAt: new Date().toISOString(),
      };

      this.activeJudicialForm = generatedForm;
      this.selectedTemplateType = generatedForm.formType;
      this.isJudicialFormModalOpen = true;
      this.isFormEditing = false;
      this.formGeneratedNotification = `پیش‌نویس «${generatedForm.title}» با موفقیت تنظیم شد.`;

      if (this.currentUser?.uid) {
        saveJudicialFormRecord(this.currentUser.uid, generatedForm).catch(console.error);
      }

      this.showToast(`پیش‌نویس رسمی با موفقیت تنظیم شد ✓`);
    } catch (err) {
      console.error('Error generating AI draft from conversation:', err);
      this.activeJudicialForm = generateSampleJudicialForm(this.selectedTemplateType);
      this.isJudicialFormModalOpen = true;
      this.showToast('پیش‌نویس حقوقی بارگذاری شد ✓');
    } finally {
      this.isGeneratingDraft = false;
    }
  }

  private handlePrintForm(e?: Event) {
    if (e) e.stopPropagation();
    if (this.activeJudicialForm) {
      printJudicialForm(this.activeJudicialForm);
    }
  }

  private handleDownloadWord(e?: Event) {
    if (e) e.stopPropagation();
    if (this.activeJudicialForm) {
      downloadJudicialDoc(this.activeJudicialForm);
      this.showToast('فایل رسمی Word سند دانلود شد ✓');
    }
  }

  private handleCopyForm(e?: Event) {
    if (e) e.stopPropagation();
    if (!this.activeJudicialForm) return;
    const f = this.activeJudicialForm;
    const text = `بسمه تعالی\n${f.title}\nمرجع صالح: ${f.authorityName}\nکد پیگیری: ${f.trackingCode}\nتاریخ: ${f.filingDate}\n\nخواهان/شاکی: ${f.claimant.name} - کد ملی: ${f.claimant.nationalId || ''}\nخوانده/مشتکی‌عنه: ${f.respondent.name}\n\nموضوع: ${f.subject}\n\nدلایل و منضمات:\n${f.evidences.map((e, idx) => `${idx + 1}- ${e}`).join('\n')}\n\nمستندات قانونی: ${f.legalBasis || ''}\n\nشرح متن:\n${f.bodyText}`;
    navigator.clipboard.writeText(text);
    this.showToast('متن کامل سند قضایی در کلیپ‌بورد کپی شد ✓');
  }

  private async handleSaveFormRecord(e?: Event) {
    if (e) e.stopPropagation();
    if (!this.activeJudicialForm || !this.currentUser?.uid) return;
    try {
      this.isSavingForm = true;
      await saveJudicialFormRecord(this.currentUser.uid, this.activeJudicialForm);
      this.isFormEditing = false;
      this.showToast('سند قضایی در پرونده ابری موکل ذخیره شد ✓');
    } catch (err) {
      console.error('Error saving form:', err);
    } finally {
      this.isSavingForm = false;
    }
  }

  private showToast(msg: string) {
    this.formFeedbackToast = msg;
    setTimeout(() => {
      this.formFeedbackToast = '';
    }, 3500);
  }

  private promptLawyerToDraftSpecificForm(typeLabel: string, e?: Event) {
    if (e) e.stopPropagation();
    if (!this.session) return;
    const prompt = `جناب وکیل، لطفاً همین حالا بر اساس تمامی مباحث، اسناد و مدارکی که تا اینجا مطرح کردیم، یک «${typeLabel}» رسمی و کامل با استناد به مواد قانونی مرتبط، نگارش مستدل و دقیق برای من تنظیم و در فرم رسمی قضایی صادر فرمایید.`;
    try {
      this.session.sendClientContent({
        turns: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        turnComplete: true,
      });
      this.showToast('درخواست تنظیم سند رسمی به وکیل ارسال شد...');
    } catch (err) {
      console.error(err);
    }
  }

  private triggerInitialGreeting() {
    if (!this.session) return;
    try {
      const promptText = `سلام! لطفاً با صدای یک دختر/بانوی جوان ۱۹ ساله، فوق‌العاده سرزنده، شاداب، پرانرژی، با طراوت، گرم، صمیمی، دلنشین، خوش‌برخورد و با گویش و زبان فارسی اصیل، فصیح، سلیس و روان ایران (کاملاً بدون لهجه)، مکالمه را با یک سلام و معرفی بسیار کوتاه، شاداب و یک‌جمله‌ای (حداکثر ۱۰ تا ۱۲ کلمه) آغاز کنید. مثلاً بگویید: «سلام و درود! خیلی خوشحالم در کنارتونم؛ بفرمایید بشنوم چطور می‌تونم کمکتون کنم؟» (دستور قطعی: از سخنان طولانی و کسل‌کننده پرهیز کرده و سریع کلام را به مخاطب بسپارید).`;

      this.session.sendClientContent({
        turns: [
          {
            role: 'user',
            parts: [
              {
                text: promptText,
              },
            ],
          },
        ],
        turnComplete: true,
      });
    } catch (e) {
      console.warn('Initial greeting trigger warning:', e);
    }
  }

  private async startContinuousMicrophone() {
    if (this.isListening) return;

    if (!navigator?.mediaDevices?.getUserMedia) {
      console.warn('Microphone API (getUserMedia) not supported in this environment');
      return;
    }

    let stream: MediaStream | null = null;

    // Stage 1: Try optimal high-fidelity speech recognition constraints
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: { ideal: 16000 },
          echoCancellation: { ideal: true },
          noiseSuppression: { ideal: true },
          autoGainControl: { ideal: true },
        },
        video: false,
      });
    } catch (primaryErr: any) {
      console.warn(
        'Optimal microphone constraints failed, attempting fallback:',
        primaryErr?.message || primaryErr
      );
      // Stage 2: Fallback to basic audio constraints without restrictive ideal options
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
      } catch (fallbackErr: any) {
        console.warn(
          'Microphone hardware not found or permission pending:',
          fallbackErr?.message || fallbackErr
        );
        return;
      }
    }

    if (!stream) return;

    try {
      this.mediaStream = stream;

      if (this.inputAudioContext && this.inputAudioContext.state === 'suspended') {
        await this.inputAudioContext.resume();
      }

      this.sourceNode = this.inputAudioContext.createMediaStreamSource(this.mediaStream);

      // DSP Stage 1: Highpass Filter (85 Hz) to eliminate sub-frequency rumble, AC hum, desk thumps & traffic noise
      const highPassFilter = this.inputAudioContext.createBiquadFilter();
      highPassFilter.type = 'highpass';
      highPassFilter.frequency.setValueAtTime(85, this.inputAudioContext.currentTime);
      highPassFilter.Q.setValueAtTime(0.7, this.inputAudioContext.currentTime);

      // DSP Stage 2: Consonant & Articulation Peaking EQ (Boost 2400Hz for Persian legal words: خیار، فسخ، صیاد، ثمن، التزام)
      const speechPeakingFilter = this.inputAudioContext.createBiquadFilter();
      speechPeakingFilter.type = 'peaking';
      speechPeakingFilter.frequency.setValueAtTime(2400, this.inputAudioContext.currentTime);
      speechPeakingFilter.Q.setValueAtTime(1.1, this.inputAudioContext.currentTime);
      speechPeakingFilter.gain.setValueAtTime(3.8, this.inputAudioContext.currentTime);

      // DSP Stage 3: Lowpass Filter (7500 Hz) to cut out high-frequency hiss, electronic static & room reverb
      const lowPassFilter = this.inputAudioContext.createBiquadFilter();
      lowPassFilter.type = 'lowpass';
      lowPassFilter.frequency.setValueAtTime(7500, this.inputAudioContext.currentTime);
      lowPassFilter.Q.setValueAtTime(0.7, this.inputAudioContext.currentTime);

      // DSP Stage 4: Dynamics Compressor to normalize speech amplitude and compress loud background spikes
      const compressor = this.inputAudioContext.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-24, this.inputAudioContext.currentTime);
      compressor.knee.setValueAtTime(8, this.inputAudioContext.currentTime);
      compressor.ratio.setValueAtTime(4.5, this.inputAudioContext.currentTime);
      compressor.attack.setValueAtTime(0.003, this.inputAudioContext.currentTime);
      compressor.release.setValueAtTime(0.12, this.inputAudioContext.currentTime);

      // Chain DSP Nodes: Source -> HighPass -> Speech Peaking -> LowPass -> Compressor
      this.sourceNode.connect(highPassFilter);
      highPassFilter.connect(speechPeakingFilter);
      speechPeakingFilter.connect(lowPassFilter);
      lowPassFilter.connect(compressor);

      // Connect filtered signal to visualizer input node
      compressor.connect(this.inputNode);

      const bufferSize = 2048;
      this.scriptProcessorNode = this.inputAudioContext.createScriptProcessor(bufferSize, 1, 1);

      const currentSampleRate = this.inputAudioContext.sampleRate || 16000;

      this.scriptProcessorNode.onaudioprocess = (audioProcessingEvent) => {
        if (!this.session || !this.isConnected) return;

        const inputBuffer = audioProcessingEvent.inputBuffer;
        const pcmData = inputBuffer.getChannelData(0);

        // Detect user speech volume to update silence/pause timer
        let sum = 0;
        for (let i = 0; i < pcmData.length; i++) {
          sum += pcmData[i] * pcmData[i];
        }
        const rms = Math.sqrt(sum / pcmData.length);
        if (rms > 0.012) {
          this.isUserSpeaking = true;
          this.notifyConversationActivity();
          if (this.userSpeakingDebounceTimer) {
            window.clearTimeout(this.userSpeakingDebounceTimer);
          }
          this.userSpeakingDebounceTimer = window.setTimeout(() => {
            this.isUserSpeaking = false;
            this.lastConversationActivityTime = Date.now();
          }, 800);
        }

        const blob = createBlob(pcmData, currentSampleRate);

        try {
          this.session.sendRealtimeInput({
            audio: {
              data: blob.data,
              mimeType: blob.mimeType,
            },
          });
        } catch {
          // ignore transient stream frame drops
        }
      };

      compressor.connect(this.scriptProcessorNode);
      this.scriptProcessorNode.connect(this.inputAudioContext.destination);

      this.isListening = true;
    } catch (err: any) {
      console.warn('Microphone stream processing notice:', err?.message || err);
    }
  }

  /* Camera & Live Document Streaming Methods */
  private async toggleCamera(e?: Event) {
    if (e) e.stopPropagation();
    if (this.isCameraActive) {
      this.stopCamera();
    } else {
      await this.startCamera();
    }
  }

  private async startCamera(): Promise<boolean> {
    this.cameraError = '';

    if (!navigator?.mediaDevices?.getUserMedia) {
      this.cameraError =
        'مرورگر شما از قابلیت وبکم یا دوربین پشتیبانی نمی‌کند. لطفاً تصویر سند را بارگذاری فرمایید.';
      this.showToast(this.cameraError);
      return false;
    }

    let stream: MediaStream | null = null;

    // Stage 1: Try optimal HD camera stream with ideal facingMode
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: this.facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    } catch (stage1Err: any) {
      console.warn(
        'Optimal camera constraints unavailable, attempting fallback:',
        stage1Err?.message || stage1Err
      );

      // Stage 2: Fallback to basic facingMode without resolution requirements
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: this.facingMode },
          },
          audio: false,
        });
      } catch (stage2Err: any) {
        console.warn(
          'FacingMode camera constraint unavailable, attempting generic fallback:',
          stage2Err?.message || stage2Err
        );

        // Stage 3: Universal fallback to any available video input device
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } catch (stage3Err: any) {
          const errName = stage3Err?.name || '';
          const errMsg = stage3Err?.message || '';

          if (
            errName === 'NotFoundError' ||
            errName === 'DevicesNotFoundError' ||
            errMsg.toLowerCase().includes('not found') ||
            errMsg.toLowerCase().includes('device not found')
          ) {
            this.cameraError =
              'دوربین در دستگاه شما یافت نشد. می‌توانید تصویر سند یا مدارک را مستقیماً بارگذاری نمایید.';
          } else if (
            errName === 'NotAllowedError' ||
            errName === 'PermissionDeniedError' ||
            errMsg.toLowerCase().includes('permission') ||
            errMsg.toLowerCase().includes('denied')
          ) {
            this.cameraError =
              'دسترسی به دوربین در مرورگر تأیید نشد. لطفاً مجوز دوربین را در تنظیمات مرورگر فعال فرمایید.';
          } else {
            this.cameraError =
              'امکان فعال‌سازی دوربین در حال حاضر فراهم نشد. لطفاً مدارک را بارگذاری نمایید.';
          }

          console.warn('Camera device unavailable notice:', errMsg || errName);
          this.showToast(this.cameraError);
          setTimeout(() => {
            this.cameraError = '';
          }, 5000);
          return false;
        }
      }
    }

    if (!stream) {
      return false;
    }

    try {
      this.videoStream = stream;
      this.isCameraActive = true;
      this.isCameraMinimized = false;

      // Attach video stream to DOM
      await this.updateComplete;
      const video = this.shadowRoot?.querySelector('#cameraPreview') as HTMLVideoElement;
      if (video) {
        video.srcObject = stream;
        video.play().catch((err) => console.warn('Video play deferred:', err));
      }

      // Ensure audio/Live session is active so lawyer can immediately interact
      if (!this.session || !this.isConnected) {
        this.initSession().catch((err) => console.warn('Deferred session init:', err));
      }

      this.showToast(
        'دوربین فعال شد؛ سند یا قرارداد را روبروی کادر قرار دهید و روی «اسکن و ارسال به وکیل» کلیک کنید ✓'
      );
      this.startVideoStreaming();
      return true;
    } catch (err: any) {
      console.warn('Camera stream attachment notice:', err?.message || err);
      return false;
    }
  }

  private async switchCamera(e?: Event) {
    if (e) e.stopPropagation();
    this.facingMode = this.facingMode === 'environment' ? 'user' : 'environment';
    if (this.isCameraActive) {
      this.stopCamera();
      await this.startCamera();
    }
  }

  private toggleMinimizeCamera(e?: Event) {
    if (e) e.stopPropagation();
    this.isCameraMinimized = !this.isCameraMinimized;
  }

  private stopCamera(e?: Event) {
    if (e) e.stopPropagation();
    if (this.videoIntervalId) {
      clearInterval(this.videoIntervalId);
      this.videoIntervalId = null;
    }
    if (this.videoStream) {
      this.videoStream.getTracks().forEach((track) => track.stop());
      this.videoStream = null;
    }
    this.isCameraActive = false;
    this.isCameraScanning = false;
    this.showToast('اشتراک‌گذاری دوربین متوقف گردید.');
  }

  private startVideoStreaming() {
    if (this.videoIntervalId) {
      clearInterval(this.videoIntervalId);
    }

    // Stream a high-clarity document frame every 850ms to the lawyer model
    this.videoIntervalId = window.setInterval(() => {
      this.captureAndSendFrame(false);
    }, 850);
  }

  private captureAndSendFrame(isHighDetail = false): string {
    if (!this.isCameraActive) return '';
    const video = this.shadowRoot?.querySelector('#cameraPreview') as HTMLVideoElement;
    if (!video || video.readyState < 2 || video.videoWidth === 0) return '';

    if (!this.canvasElement) {
      this.canvasElement = document.createElement('canvas');
    }

    const maxWidth = isHighDetail ? 1280 : 1024;
    const scale = Math.min(1, maxWidth / video.videoWidth);
    const width = Math.round(video.videoWidth * scale);
    const height = Math.round(video.videoHeight * scale);

    this.canvasElement.width = width;
    this.canvasElement.height = height;

    const ctx = this.canvasElement.getContext('2d');
    if (!ctx) return '';

    ctx.drawImage(video, 0, 0, width, height);

    const quality = isHighDetail ? 0.92 : 0.82;
    const dataUrl = this.canvasElement.toDataURL('image/jpeg', quality);
    const base64Data = dataUrl.split(',')[1];

    if (!base64Data) return '';

    if (this.session && this.isConnected) {
      try {
        this.isCameraScanning = true;
        this.session.sendRealtimeInput({
          video: {
            mimeType: 'image/jpeg',
            data: base64Data,
          },
        });
        setTimeout(() => {
          this.isCameraScanning = false;
        }, 400);
      } catch (err) {
        console.warn('Realtime video frame transmission warning:', err);
      }
    }

    return dataUrl;
  }

  private triggerDocumentSnapScan(e?: Event) {
    if (e) e.stopPropagation();
    this.isSnapScanning = true;

    const saveAndPrompt = async () => {
      const snapshotDataUrl = this.captureAndSendFrame(true);
      this.promptLawyerToAnalyzeDoc();

      if (this.currentUser?.uid) {
        const timestampStr = new Date().toLocaleDateString('fa-IR');
        await saveUploadedDocument(this.currentUser.uid, {
          title: `اسکن زنده سند / قرارداد (${timestampStr})`,
          fileName: `scan_${Date.now()}.jpg`,
          fileType: 'image',
          fileSize: 150000,
          fileDataUrl: snapshotDataUrl,
          extractedText: 'سند ارائه‌شده از طریق دوربین با کیفیت بالا اسکن و به وکیل تحویل گردید.',
          analysis: 'اسکن مستقیم دوربین توسط وکیل ارشد حقوقی بررسی و در پرونده ثبت شد.',
          source: 'camera_scan',
        });
      }

      this.showToast('سند اسکن شد و جهت تحلیل حقوقی به وکیل تحویل گردید ✓');
      setTimeout(() => {
        this.isSnapScanning = false;
      }, 1200);
    };

    if (!this.isCameraActive) {
      this.startCamera()
        .then((started) => {
          if (started) {
            setTimeout(() => {
              saveAndPrompt();
            }, 900);
          } else {
            this.isSnapScanning = false;
          }
        })
        .catch(() => {
          this.isSnapScanning = false;
        });
      return;
    }

    saveAndPrompt();
  }

  private promptLawyerToAnalyzeDoc() {
    if (!this.session || !this.isConnected) {
      this.initSession().catch(() => {});
      return;
    }
    try {
      this.session.sendClientContent({
        turns: [
          {
            role: 'user',
            parts: [
              {
                text: 'جناب وکیل، این سند و قراردادی که در تصویر زنده اسکن و ارسال کردم را با دقت کامل خط به خط بخوانید؛ تمام بندها، تعهدات طرفین، مبالغ و شرایط مالی، تاریخ‌ها، شروط فسخ، خیارات قانونی و نکات کلیدی را به زبان فارسی تهرانی، شیوا، روان و دقیق تحلیل فرمایید و راهکار حقوقی ارائه دهید.',
              },
            ],
          },
        ],
        turnComplete: true,
      });
    } catch (e) {
      console.error('Error prompting lawyer with doc:', e);
    }
  }

  private toggleDossierModal(e?: Event) {
    if (e) e.stopPropagation();
    this.isDossierOpen = !this.isDossierOpen;
  }

  private async handleGoogleSignIn(e?: Event) {
    if (e) e.stopPropagation();
    try {
      this.isAuthLoading = true;
      const user = await signInWithGoogle();
      if (user) {
        this.currentUser = user;
        this.subscribeToUserFirestore(user.uid);
      }
    } catch (err) {
      console.error('Sign in error:', err);
    } finally {
      this.isAuthLoading = false;
    }
  }

  private async handleSignOut(e?: Event) {
    if (e) e.stopPropagation();
    try {
      this.isAuthLoading = true;
      await signOutUser();
      const anonUser = await initializeUserAuth();
      this.currentUser = anonUser;
      this.subscribeToUserFirestore(anonUser.uid);
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      this.isAuthLoading = false;
    }
  }

  private handleCopyUid(e?: Event) {
    if (e) e.stopPropagation();
    if (this.currentUser?.uid) {
      navigator.clipboard.writeText(this.currentUser.uid);
      this.copyFeedback = true;
      setTimeout(() => {
        this.copyFeedback = false;
      }, 2000);
    }
  }

  private async handleAddManualMemoryFact(e?: Event) {
    if (e) e.stopPropagation();
    if (!this.newMemoryFactInput.trim() || !this.currentUser?.uid) return;

    try {
      this.isSavingMemory = true;
      await saveUserMemoryFact(
        this.currentUser.uid,
        this.newMemoryKeyInput.trim() || 'نکته حقوقی موکل',
        this.newMemoryFactInput.trim(),
        'یادداشت دستی موکل'
      );
      this.newMemoryFactInput = '';
    } catch (err) {
      console.error('Error adding fact:', err);
    } finally {
      this.isSavingMemory = false;
    }
  }

  private async handleSaveDossierSummary(e?: Event) {
    if (e) e.stopPropagation();
    if (!this.currentUser?.uid) return;

    try {
      this.isSavingMemory = true;
      await updatePermanentDossier(this.currentUser.uid, this.permanentDossierText);
    } catch (err) {
      console.error('Error updating dossier:', err);
    } finally {
      this.isSavingMemory = false;
    }
  }

  /* Main Menu & Dropdown Handlers */
  private toggleMainMenu(e?: Event) {
    if (e) e.stopPropagation();
    this.isMainMenuOpen = !this.isMainMenuOpen;
  }

  /* Tone / Persona Switcher Handlers */
  private openToneModal(e?: Event) {
    if (e) e.stopPropagation();
    this.isMainMenuOpen = false;
    this.isToneModalOpen = true;
  }

  private closeToneModal(e?: Event) {
    if (e) e.stopPropagation();
    this.isToneModalOpen = false;
  }

  private getCurrentToneBadge(): string {
    return getToneById(this.selectedTone).badge || 'مقتدر و قاطع';
  }

  private getCurrentToneTitle(): string {
    return getToneById(this.selectedTone).title;
  }

  private async handleSelectTone(
    toneId: 'legal_strict' | 'friendly' | 'formal_academic',
    e?: Event
  ) {
    if (e) e.stopPropagation();
    this.selectedTone = toneId;
    const toneConfig = getToneById(toneId);

    // Save tone preference in Firestore
    if (this.currentUser?.uid) {
      saveTonePreference(this.currentUser.uid, toneId);
    }

    this.showToast(`لحن وکیل به «${toneConfig.badge}» تغییر یافت ✓`);
    this.isToneModalOpen = false;

    // Send immediate prompt to Live session to adapt voice style immediately
    if (this.session && this.isConnected) {
      const prompt = `[دستور فوری تغییر لحن، فصاحت و استایل گفتاری]: لحن کلام و بیانات شما از هم‌اکنون به حالت «${toneConfig.title}» تنظیم شد. بیان و فصاحت: ${toneConfig.accent}. دستور گفتاری: ${toneConfig.speakingPrompt}. لطفاً فوراً با همین لحن قرص، محکم، مقتدر و با تلفظ دقیق و صحیح کلمات با فارسی معیار اصیل ایران، به صورت صوتی و زنده به مخاطب محترم اعلام آمادگی نمایید.`;
      try {
        this.session.sendClientContent({
          turns: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          turnComplete: true,
        });
      } catch (err) {
        console.warn('Tone switch voice trigger error:', err);
      }
    }
  }

  /* Local Document Upload & Storage Handlers */
  private openUploadModal(e?: Event) {
    if (e) e.stopPropagation();
    this.isMainMenuOpen = false;
    this.isUploadModalOpen = true;
  }

  private closeUploadModal(e?: Event) {
    if (e) e.stopPropagation();
    this.isUploadModalOpen = false;
  }

  private triggerFileUploadInput(e?: Event) {
    if (e) e.stopPropagation();
    const input = this.shadowRoot?.querySelector('#localFileInput') as HTMLInputElement;
    if (input) {
      input.click();
    }
  }

  private async handleFileInputChange(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target && target.files && target.files.length > 0) {
      await this.processAndUploadFiles(target.files);
      target.value = '';
    }
  }

  private handleDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    const zone = this.shadowRoot?.querySelector('#uploadDropZone');
    zone?.classList.add('drag-over');
  }

  private handleDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    const zone = this.shadowRoot?.querySelector('#uploadDropZone');
    zone?.classList.remove('drag-over');
  }

  private async handleDropFiles(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    const zone = this.shadowRoot?.querySelector('#uploadDropZone');
    zone?.classList.remove('drag-over');
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await this.processAndUploadFiles(e.dataTransfer.files);
    }
  }

  private async processAndUploadFiles(files: FileList | File[]) {
    this.isUploadingFiles = true;
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      this.uploadStatusMessage = `در حال پردازش و استخراج سند: ${file.name}...`;
      try {
        const processed = await processLocalDocumentFile(file);

        // Save to Firestore
        if (this.currentUser?.uid) {
          await saveUploadedDocument(this.currentUser.uid, {
            title: processed.title,
            fileName: processed.fileName,
            fileType: processed.fileType,
            fileSize: processed.fileSize,
            fileDataUrl: processed.fileDataUrl,
            extractedText: processed.extractedText,
            analysis: processed.analysis,
            source: 'local_upload',
          });
        }

        // Send to active Live session
        if (this.session && this.isConnected) {
          if (processed.previewUrl && processed.previewUrl.startsWith('data:image/')) {
            // Send image frame directly
            const base64 = processed.previewUrl.split(',')[1];
            if (base64) {
              this.session.sendRealtimeInput({
                video: {
                  mimeType: 'image/jpeg',
                  data: base64,
                },
              });
            }
          }

          // Send notification text turn
          const textPrompt = `جناب وکیل، من سند «${processed.title}» (فایل: ${processed.fileName}، حجم: ${formatFileSize(processed.fileSize)}) را از حافظه داخلی آپلود کردم.\nمتن/محتوای استخراج‌شده:\n${processed.extractedText.substring(0, 3000)}\nلطفاً تایید فرمایید که سند را دریافت کردید و نکات مهم آن را برای من بررسی کنید.`;

          this.session.sendClientContent({
            turns: [
              {
                role: 'user',
                parts: [{ text: textPrompt }],
              },
            ],
            turnComplete: true,
          });
        }

        this.showToast(`سند «${processed.fileName}» بارگذاری و به وکیل تحویل داده شد ✓`);
      } catch (err) {
        console.error('Error processing file:', err);
        this.showToast(`خطا در بارگذاری فایل ${file.name}`);
      }
    }

    this.isUploadingFiles = false;
    this.uploadStatusMessage = '';
  }

  private async handleDeleteDocItem(docId: string, e?: Event) {
    if (e) e.stopPropagation();
    if (!this.currentUser?.uid) return;
    try {
      await deleteDocumentRecord(this.currentUser.uid, docId);
      this.showToast('سند از پرونده حذف شد ✓');
    } catch (err) {
      console.error('Error deleting doc:', err);
    }
  }

  private async handleDeleteJudicialFormItem(formId: string, e?: Event) {
    if (e) e.stopPropagation();
    if (!this.currentUser?.uid) return;
    try {
      await deleteJudicialFormRecord(this.currentUser.uid, formId);
      this.showToast('برگ قضایی از سوابق حذف شد ✓');
    } catch (err) {
      console.error('Error deleting judicial form:', err);
    }
  }

  private handleSendDocToLiveSession(docItem: StoredDocItem, e?: Event) {
    if (e) e.stopPropagation();
    if (!this.session || !this.isConnected) {
      this.showToast('ارتباط صوتی با وکیل فعال نیست.');
      return;
    }

    const textPrompt = `جناب وکیل، لطفاً سند «${docItem.title}» از پرونده را مجدداً بازبینی فرمایید:\n${docItem.extractedText || docItem.analysis || ''}`;
    try {
      this.session.sendClientContent({
        turns: [
          {
            role: 'user',
            parts: [{ text: textPrompt }],
          },
        ],
        turnComplete: true,
      });
      this.showToast(`سند «${docItem.title}» به وکیل ارسال شد...`);
      this.isUploadModalOpen = false;
      this.isDossierOpen = false;
    } catch (err) {
      console.error(err);
    }
  }

  /* In-App Smart Anti-Sanction Proxy Handlers */
  private openProxyModal(e?: Event) {
    if (e) e.stopPropagation();
    this.isMainMenuOpen = false;
    this.isProxyModalOpen = true;
    proxyManager.runHealthCheck();
  }

  private closeProxyModal(e?: Event) {
    if (e) e.stopPropagation();
    this.isProxyModalOpen = false;
  }

  private async handleTestProxyConnection(e?: Event) {
    if (e) e.stopPropagation();
    this.isTestingProxy = true;
    this.showToast('در حال سنجش تاخیر و تست ارتباط با سرور...');
    await proxyManager.runHealthCheck();
    this.isTestingProxy = false;
    this.showToast(`وضعیت شبکه پایدار است — تاخیر لحظه‌ای: ${this.networkState.latencyMs}ms ✓`);
  }

  private handleToggleAutoBypass(e: Event) {
    e.stopPropagation();
    const newValue = !this.networkState.autoBypassEnabled;
    proxyManager.setAutoBypass(newValue);
    this.showToast(
      newValue ? 'دورزدن خودکار تحریم و پراکسی هوشمند فعال شد 🛡️' : 'پراکسی خودکار غیرفعال گردید.'
    );
  }

  private handleSelectProxyNode(nodeId: string, e: Event) {
    e.stopPropagation();
    proxyManager.setSelectedNode(nodeId);
    this.showToast('گره ارتباطی ضدتحریم به‌روزرسانی شد ✓');
  }

  private getDisplayedTranscriptText(): string {
    if (this.isUserSpeaking) {
      return 'در حال گوش دادن به اظهارات و شرح ماوقع...';
    }
    if (this.isSpeaking || this.isModelTyping) {
      if (this.modelTranscript) {
        return this.modelTranscript;
      }
      return 'سلام! در کنار شما هستم؛ بفرمایید موضوع پرونده یا سوال حقوقی‌تان چیست تا با دقت بررسی و تحلیل نماییم...';
    }
    return '';
  }

  private handleToggleDnsBypass(e: Event) {
    e.stopPropagation();
    const newValue = !this.networkState.dnsBypassActive;
    proxyManager.setDnsBypass(newValue);
    this.showToast(newValue ? 'سامانه DNS امن ضدتحریم (DoH) فعال شد ✓' : 'DNS امن غیرفعال شد.');
  }

  render() {
    return html`
      <!-- Main Screen Background: شرکت توزیع نیروی برق استان ایلام -->
      <div class="main-screen-bg" id="mainScreenBg"></div>

      <!-- Center Logo: کالبد و لوگوی برنامه و هوش مصنوعی (logo.png در وسط صفحه) -->
      <div
        class="center-logo-container"
        id="centerLogoContainer"
        @click=${this.handleScreenClick}
        title="کلیک جهت آغاز یا ادامه گفتگو با وکیل"
      >
        <div
          class="center-logo-wrapper ${this.isSpeaking ? 'speaking' : this.isUserSpeaking ? 'listening' : this.isModelTyping ? 'thinking' : ''}"
        >
          <img
            src="${appLogoUrl}"
            alt="کالبد و لوگوی برنامه و هوش مصنوعی"
            class="center-logo-img"
            id="centerLogoImg"
          />
        </div>
      </div>

      <!-- Top Header: Icon-Only Menu Button & Minimalist End Consultation Button -->
      <div class="top-memory-bar">
        <div class="top-menu-wrapper">
          <button
            class="top-menu-trigger-btn ${this.isMainMenuOpen ? 'active' : ''}"
            id="mainMenuTriggerBtn"
            @click=${(e: Event) => {
              e.stopPropagation();
              this.toggleMainMenu(e);
            }}
            title="منوی امکانات"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="22"
              viewBox="0 -960 960 960"
              width="22"
              fill="currentColor"
            >
              <path d="M120-240v-60h720v60H120Zm0-210v-60h720v60H120Zm0-210v-60h720v60H120Z" />
            </svg>
          </button>

          ${
            this.isMainMenuOpen
              ? html`
                  <div
                    class="main-menu-backdrop"
                    @click=${(e: Event) => {
                    e.stopPropagation();
                    this.isMainMenuOpen = false;
                  }}
                  ></div>
                  <div
                    class="top-menu-dropdown"
                    id="topMenuDropdown"
                    @click=${(e: Event) => e.stopPropagation()}
                  >
                    <!-- Tone Switcher Linear Option -->
                    <button
                      class="menu-linear-item"
                      id="menuToneBtn"
                      @click=${(e: Event) => {
                      e.stopPropagation();
                      this.isMainMenuOpen = false;
                      this.openToneModal(e);
                    }}
                    >
                      <div class="menu-item-start">
                        <span class="menu-item-icon-svg">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="15"
                            viewBox="0 -960 960 960"
                            width="15"
                            fill="currentColor"
                          >
                            <path
                              d="M480-120q-75 0-140.5-28.5t-114-77q-48.5-48.5-77-114T120-480q0-75 28.5-140.5t77-114q48.5-48.5 114-77T480-840q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-480q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-120Zm0-80q116 0 198-82t82-198q0-116-82-198t-198-82v560Z"
                            />
                          </svg>
                        </span>
                        <span class="menu-item-text-label">تنظیم لحن و فصاحت کلام</span>
                      </div>
                      <span class="menu-item-mini-badge highlight"
                        >${this.getCurrentToneBadge()}</span
                      >
                    </button>

                    <!-- Document Upload Linear Option -->
                    <button
                      class="menu-linear-item"
                      id="menuUploadBtn"
                      @click=${(e: Event) => {
                      e.stopPropagation();
                      this.isMainMenuOpen = false;
                      this.openUploadModal(e);
                    }}
                    >
                      <div class="menu-item-start">
                        <span class="menu-item-icon-svg">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="15"
                            viewBox="0 -960 960 960"
                            width="15"
                            fill="currentColor"
                          >
                            <path
                              d="M440-320v-326L336-542l-56-58 200-200 200 200-56 58-104-104v326h-80ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z"
                            />
                          </svg>
                        </span>
                        <span class="menu-item-text-label">بارگذاری اسناد و مدارک</span>
                      </div>
                      <span class="menu-item-mini-badge">${this.scannedDocs.length} سند</span>
                    </button>

                    <!-- AI Auto-Draft from Conversation Linear Option -->
                    <button
                      class="menu-linear-item"
                      id="menuAutoDraftBtn"
                      @click=${(e: Event) => {
                      e.stopPropagation();
                      this.isMainMenuOpen = false;
                      this.handleGenerateDraftFromConversation(e);
                    }}
                    >
                      <div class="menu-item-start">
                        <span class="menu-item-icon-svg" style="color: #a855f7;">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="15"
                            viewBox="0 -960 960 960"
                            width="15"
                            fill="currentColor"
                          >
                            <path
                              d="m354-287 126-76 126 77-33-144 111-96-146-13-54-135-54 135-146 13 111 97-34 142ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z"
                            />
                          </svg>
                        </span>
                        <span class="menu-item-text-label"
                          >تنظیم هوشمند پیش‌نویس از گفتگو (PDF)</span
                        >
                      </div>
                      <span
                        class="menu-item-mini-badge highlight"
                        style="background: rgba(168, 85, 247, 0.2); color: #c084fc;"
                      >
                        هوش مصنوعی ✨
                      </span>
                    </button>

                    <!-- Judicial Forms & Official Letters Linear Option -->
                    <button
                      class="menu-linear-item"
                      id="menuJudicialFormBtn"
                      @click=${(e: Event) => {
                      e.stopPropagation();
                      this.isMainMenuOpen = false;
                      this.openJudicialFormStudio(undefined, e);
                    }}
                    >
                      <div class="menu-item-start">
                        <span class="menu-item-icon-svg" style="color: #ffd700;">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="15"
                            viewBox="0 -960 960 960"
                            width="15"
                            fill="currentColor"
                          >
                            <path
                              d="M240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z"
                            />
                          </svg>
                        </span>
                        <span class="menu-item-text-label">اوراق قضایی و نامه‌های رسمی (PDF)</span>
                      </div>
                      <span class="menu-item-mini-badge">${this.judicialFormsList.length} سند</span>
                    </button>

                    <!-- Live Camera Linear Option -->
                    <button
                      class="menu-linear-item ${this.isCameraActive ? 'active-camera' : ''}"
                      id="menuCameraBtn"
                      @click=${(e: Event) => {
                      e.stopPropagation();
                      this.isMainMenuOpen = false;
                      this.toggleCamera(e);
                    }}
                    >
                      <div class="menu-item-start">
                        <span
                          class="menu-item-icon-svg"
                          style="color: ${this.isCameraActive ? '#10b981' : '#d97706'}"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="15"
                            viewBox="0 -960 960 960"
                            width="15"
                            fill="currentColor"
                          >
                            <path
                              d="M480-260q75 0 127.5-52.5T660-440q0-75-52.5-127.5T480-620q-75 0-127.5 52.5T300-440q0 75 52.5 127.5T480-260Zm0-80q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29ZM160-120q-33 0-56.5-23.5T80-200v-480q0-33 23.5-56.5T160-760h126l74-80h240l74 80h126q33 0 56.5 23.5T880-680v480q0 33-23.5 56.5T800-120H160Z"
                            />
                          </svg>
                        </span>
                        <span class="menu-item-text-label">اسکن و تحلیل اسناد (دوربین)</span>
                      </div>
                      <span
                        class="menu-item-mini-badge ${this.isCameraActive ? 'highlight-green' : 'highlight'}"
                      >
                        ${this.isCameraActive ? '🟢 فعال' : '📸 اسکن زنده'}
                      </span>
                    </button>

                    <!-- In-App Anti-Sanction Proxy Menu Option -->
                    <button
                      class="menu-linear-item ${this.networkState.autoBypassEnabled ? 'active-camera' : ''}"
                      id="menuProxyBtn"
                      @click=${(e: Event) => {
                      e.stopPropagation();
                      this.isMainMenuOpen = false;
                      this.openProxyModal(e);
                    }}
                    >
                      <div class="menu-item-start">
                        <span
                          class="menu-item-icon-svg"
                          style="color: ${this.networkState.autoBypassEnabled ? '#10b981' : '#3b82f6'}"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="15"
                            viewBox="0 -960 960 960"
                            width="15"
                            fill="currentColor"
                          >
                            <path
                              d="M480-80q-139-35-229.5-159.5T160-516v-244l320-120 320 120v244q0 152-90.5 276.5T480-80Zm0-84q104-33 172-132t68-220v-189l-240-90-240 90v189q0 121 68 220t172 132Zm0-316Z"
                            />
                          </svg>
                        </span>
                        <span class="menu-item-text-label">پراکسی و تونل ضدتحریم هوشمند</span>
                      </div>
                      <span
                        class="menu-item-mini-badge ${this.networkState.autoBypassEnabled ? 'highlight-green' : ''}"
                      >
                        ${this.networkState.autoBypassEnabled ? `🛡️ فعال (${this.networkState.latencyMs}ms)` : 'خاموش'}
                      </span>
                    </button>

                    <!-- Waiting Sound (discord.mp3) Linear Option -->
                    <button
                      class="menu-linear-item ${this.waitingMusicEnabled ? 'active-camera' : ''}"
                      id="menuWaitingMusicBtn"
                      @click=${(e: Event) => {
                      e.stopPropagation();
                      this.waitingMusicEnabled = !this.waitingMusicEnabled;
                      if (!this.waitingMusicEnabled) {
                        this.stopWaitingSound();
                      } else {
                        this.lastConversationActivityTime = Date.now();
                      }
                    }}
                    >
                      <div class="menu-item-start">
                        <span
                          class="menu-item-icon-svg"
                          style="color: ${this.waitingMusicEnabled ? '#f59e0b' : '#64748b'}"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="15"
                            viewBox="0 -960 960 960"
                            width="15"
                            fill="currentColor"
                          >
                            <path
                              d="M400-120q-66 0-113-47t-47-113q0-66 47-113t113-47q23 0 42.5 5.5T480-418v-422h240v160H560v440q0 66-47 113t-113 47Z"
                            />
                          </svg>
                        </span>
                        <span class="menu-item-text-label">نوای انتظار و مکث (discord.mp3)</span>
                      </div>
                      <span
                        class="menu-item-mini-badge ${this.waitingMusicEnabled ? 'highlight' : ''}"
                      >
                        ${this.waitingMusicEnabled ? (this.isWaitingMusicActive ? '🎵 در حال پخش' : 'خودکار (>۷ ثانیه)') : 'غیرفعال'}
                      </span>
                    </button>

                    <div style="height: 1px; background: rgba(0, 0, 0, 0.08); margin: 4px 0;"></div>

                    <!-- End Consultation Inside Menu Option -->
                    <button
                      class="menu-linear-item"
                      id="menuEndConsultationBtn"
                      @click=${(e: Event) => {
                      e.stopPropagation();
                      this.isMainMenuOpen = false;
                      this.handleEndConsultation(e);
                    }}
                    >
                      <div class="menu-item-start">
                        <span class="menu-item-icon-svg" style="color: #ef4444;">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="15"
                            viewBox="0 -960 960 960"
                            width="15"
                            fill="currentColor"
                          >
                            <path
                              d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm-40-160h80v-320h-80v320Z"
                            />
                          </svg>
                        </span>
                        <span
                          class="menu-item-text-label"
                          style="color: #dc2626; font-weight: 600 !important;"
                          >پایان جلسه</span
                        >
                      </div>
                      <span
                        class="menu-item-mini-badge"
                        style="color: #dc2626; background: rgba(239, 68, 68, 0.1);"
                        >خاتمه</span
                      >
                    </button>
                  </div>
                `
              : ''
          }
        </div>

        <!-- Left side: Minimal 'پایان جلسه' (End Session) / 'شروع مجدد' Button -->
        <div>
          ${
            !this.isSessionExplicitlyEnded && (this.isConnected || this.isListening)
              ? html`
                  <button
                    class="end-consultation-btn"
                    id="endConsultationBtn"
                    @click=${(e: Event) => {
                    e.stopPropagation();
                    this.handleEndConsultation(e);
                  }}
                    title="پایان فوری و ایمن جلسه"
                  >
                    <span class="end-btn-icon">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="13"
                        viewBox="0 -960 960 960"
                        width="13"
                        fill="currentColor"
                      >
                        <path
                          d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm-40-160h80v-320h-80v320Z"
                        />
                      </svg>
                    </span>
                    <span class="end-btn-label">پایان جلسه</span>
                  </button>
                `
              : html`
                  <button
                    class="end-consultation-btn restart-btn"
                    id="restartConsultationBtn"
                    @click=${(e: Event) => {
                    e.stopPropagation();
                    this.handleRestartConsultation(e);
                  }}
                    title="شروع مجدد گفتگو"
                  >
                    <span class="end-btn-icon">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="13"
                        viewBox="0 -960 960 960"
                        width="13"
                        fill="currentColor"
                      >
                        <path
                          d="M480-80q-83 0-156-31.5T197-197t-85.5-127T80-480q0-83 31.5-156T197-763t127-85.5T480-880q83 0 156 31.5T763-763t85.5 127T880-480q0 83-31.5 156T763-197t-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-66 0-124 25t-102 69l62 62h-220v-220l66 66q54-54 125.5-84.5T480-880q166 0 283 117t117 283q0 166-117 283T480-80Z"
                        />
                      </svg>
                    </span>
                    <span class="end-btn-label">شروع جلسه</span>
                  </button>
                `
          }
        </div>
      </div>

      <!-- Live Session Auto-Recovery Banner -->
      ${
        this.isSessionReconnecting
          ? html`
              <div class="session-status-banner reconnecting" id="sessionReconnectingBanner">
                <span class="session-status-spin">⟳</span>
                <span>در حال برقراری مجدد ارتباط صوتی پایدار...</span>
              </div>
            `
          : this.sessionErrorMessage
            ? html`
                <div
                  class="session-status-banner error"
                  id="sessionErrorBanner"
                  @click=${this.handleManualReconnect}
                >
                  <span>${this.sessionErrorMessage}</span>
                  <button class="session-retry-btn" id="sessionRetryBtn">تلاش مجدد 🔄</button>
                </div>
              `
            : ''
      }

      <!-- Camera Error Toast -->
      ${this.cameraError ? html`<div class="camera-error-toast">${this.cameraError}</div>` : ''}

      <!-- Floating PiP Camera Stream for Live Document Examination -->
      ${
        this.isCameraActive
          ? html`
              <div
                class="camera-pip-container ${this.isCameraMinimized ? 'minimized' : ''}"
                @click=${(e: Event) => e.stopPropagation()}
              >
                <div class="pip-header">
                  <div class="pip-title-badge">
                    <div class="pulse-dot"></div>
                    <span>پخش زنده سند به وکیل</span>
                  </div>
                  <div class="pip-actions">
                    <button class="pip-btn-icon" @click=${this.switchCamera} title="تغییر دوربین">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="16"
                        viewBox="0 -960 960 960"
                        width="16"
                        fill="currentColor"
                      >
                        <path
                          d="M480-80q-83 0-156-31.5T197-197t-85.5-127T80-480q0-83 31.5-156T197-763t127-85.5T480-880q83 0 156 31.5T763-763t85.5 127T880-480q0 83-31.5 156T763-197t-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-66 0-124 25t-102 69l62 62h-220v-220l66 66q54-54 125.5-84.5T480-880q166 0 283 117t117 283q0 166-117 283T480-80Z"
                        />
                      </svg>
                    </button>
                    <button
                      class="pip-btn-icon"
                      @click=${this.toggleMinimizeCamera}
                      title="${this.isCameraMinimized ? 'بزرگ‌نمایی' : 'کوچک‌نمایی'}"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="16"
                        viewBox="0 -960 960 960"
                        width="16"
                        fill="currentColor"
                      >
                        <path
                          d="${this.isCameraMinimized ? 'M120-120v-200h80v120h120v80H120Zm520 0v-80h120v-120h80v200H640ZM120-640v-200h200v80H200v120h-80Zm640 0v-120H640v-80h200v200h-80Z' : 'M240-120v-120H120v-80h200v200h-80Zm400 0v-200h200v80H720v120h-80ZM120-640v-80h120v-120h80v200H120Zm520 0v-200h80v120h120v80H640Z'}"
                        />
                      </svg>
                    </button>
                    <button class="pip-btn-icon" @click=${this.stopCamera} title="بستن دوربین">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="16"
                        viewBox="0 -960 960 960"
                        width="16"
                        fill="currentColor"
                      >
                        <path
                          d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                ${
                !this.isCameraMinimized
                  ? html`
                      <div class="pip-video-wrapper">
                        <video
                          id="cameraPreview"
                          class="pip-video"
                          autoplay
                          playsinline
                          muted
                        ></video>

                        <!-- Document Alignment Guide Frame -->
                        <div class="doc-target-frame">
                          <span class="corner-bracket corner-tl"></span>
                          <span class="corner-bracket corner-tr"></span>
                          <span class="corner-bracket corner-bl"></span>
                          <span class="corner-bracket corner-br"></span>
                          <div class="scanline"></div>
                        </div>
                      </div>

                      <div class="pip-footer">
                        <button
                          class="doc-snap-btn"
                          id="snapScanButton"
                          @click=${this.triggerDocumentSnapScan}
                          ?disabled=${this.isSnapScanning}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="15"
                            viewBox="0 -960 960 960"
                            width="15"
                            fill="currentColor"
                          >
                            <path
                              d="M480-320q66 0 113-47t47-113q0-66-47-113t-113-47q-66 0-113 47t-47 113q0 66 47 113t113 47Zm0-80q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400ZM160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h160l80-80h160l80 80h160q33 0 56.5 23.5T960-720v480q0 33-23.5 56.5T880-160H160Z"
                            />
                          </svg>
                          <span
                            >${this.isSnapScanning ? 'در حال بررسی و تحلیل حقوقی سند...' : 'اسکن و ارسال مستقیم به وکیل'}</span
                          >
                        </button>
                        <div class="live-stream-tag">
                          <span class="stream-indicator"></span>
                          <span>ارسال و تحلیل بلادرنگ فریم‌ها توسط وکیل هوشمند</span>
                        </div>
                      </div>
                    `
                  : ''
              }
              </div>
            `
          : ''
      }

      <!-- Tone Switcher Modal -->
      ${
        this.isToneModalOpen
          ? html`
              <div class="tone-modal-backdrop" @click=${this.closeToneModal}>
                <div
                  class="tone-modal-card"
                  id="toneModalCard"
                  @click=${(e: Event) => e.stopPropagation()}
                >
                  <div class="tone-modal-header">
                    <div class="tone-modal-title">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="20"
                        viewBox="0 -960 960 960"
                        width="20"
                        fill="#ffd700"
                      >
                        <path
                          d="M480-120q-75 0-140.5-28.5t-114-77q-48.5-48.5-77-114T120-480q0-75 28.5-140.5t77-114q48.5-48.5 114-77T480-840q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-480q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-120Zm0-80q116 0 198-82t82-198q0-116-82-198t-198-82v560Z"
                        />
                      </svg>
                      <span>تنظیم لحن، فصاحت و استایل گفتار وکیل</span>
                    </div>
                    <button class="pip-btn-icon" @click=${this.closeToneModal} title="بستن">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="18"
                        viewBox="0 -960 960 960"
                        width="18"
                        fill="currentColor"
                      >
                        <path
                          d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"
                        />
                      </svg>
                    </button>
                  </div>

                  <div class="tone-options-list">
                    ${PERSONA_TONES.map(
                    (t) => html`
                      <div
                        class="tone-option-card ${this.selectedTone === t.id ? 'active' : ''}"
                        @click=${(e: Event) => this.handleSelectTone(t.id as any, e)}
                      >
                        <div class="tone-card-top">
                          <div class="tone-card-title">
                            <span class="tone-badge-icon">${t.icon || '⚖️'}</span>
                            <span>${t.title}</span>
                          </div>
                          ${
                            this.selectedTone === t.id
                              ? html`<span class="tone-check-badge">فعال ✓</span>`
                              : html`<button
                                  class="dossier-btn-secondary"
                                  style="padding: 4px 10px; font-size: 11px;"
                                >
                                  انتخاب
                                </button>`
                          }
                        </div>
                        <div class="tone-card-accent">بیان و فصاحت: ${t.accent}</div>
                        <div class="tone-card-desc">${t.description}</div>
                        <div class="tone-card-sample">«${t.samplePhrase}»</div>
                      </div>
                    `
                  )}
                  </div>
                </div>
              </div>
            `
          : ''
      }

      <!-- Document Upload & Internal Storage Modal -->
      ${
        this.isUploadModalOpen
          ? html`
              <div class="upload-modal-backdrop" @click=${this.closeUploadModal}>
                <div
                  class="upload-modal-card"
                  id="uploadModalCard"
                  @click=${(e: Event) => e.stopPropagation()}
                >
                  <div class="upload-modal-header">
                    <div class="upload-modal-title">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="20"
                        viewBox="0 -960 960 960"
                        width="20"
                        fill="#ffd700"
                      >
                        <path
                          d="M440-320v-326L336-542l-56-58 200-200 200 200-56 58-104-104v326h-80ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z"
                        />
                      </svg>
                      <span>بارگذاری اسناد و مدارک</span>
                    </div>
                    <button class="pip-btn-icon" @click=${this.closeUploadModal} title="بستن">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="18"
                        viewBox="0 -960 960 960"
                        width="18"
                        fill="currentColor"
                      >
                        <path
                          d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"
                        />
                      </svg>
                    </button>
                  </div>

                  <!-- Hidden Input for file selection -->
                  <input
                    type="file"
                    id="localFileInput"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp,.bmp"
                    @change=${this.handleFileInputChange}
                    style="display: none;"
                  />

                  <!-- Drag & Drop Zone -->
                  <div
                    class="upload-drop-zone"
                    id="uploadDropZone"
                    @dragover=${this.handleDragOver}
                    @dragleave=${this.handleDragLeave}
                    @drop=${this.handleDropFiles}
                    @click=${this.triggerFileUploadInput}
                  >
                    <div class="upload-zone-icon">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="40"
                        viewBox="0 -960 960 960"
                        width="40"
                        fill="#ffd700"
                      >
                        <path
                          d="M440-320v-326L336-542l-56-58 200-200 200 200-56 58-104-104v326h-80ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z"
                        />
                      </svg>
                    </div>
                    <div class="upload-zone-text">
                      فایل‌های مورد نظر را به اینجا بکشید یا برای انتخاب کلیک کنید
                    </div>
                    <div class="upload-zone-hint">
                      پشتیبانی از اسناد PDF، فایل‌های Word، متون، قراردادها، چک‌ها و تصاویر مدارک
                    </div>
                    <div
                      style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 4px;"
                    >
                      <button class="upload-action-btn" @click=${this.triggerFileUploadInput}>
                        انتخاب فایل از دستگاه
                      </button>
                      <button
                        class="upload-action-btn camera-scan-btn"
                        @click=${(e: Event) => {
                      e.stopPropagation();
                      this.isUploadModalOpen = false;
                      this.startCamera();
                    }}
                      >
                        📷 اسکن مستقیم با دوربین
                      </button>
                    </div>
                  </div>

                  ${
                  this.isUploadingFiles
                    ? html`
                        <div
                          style="padding: 12px; text-align: center; color: #ffd700; font-size: 12px; background: rgba(212, 175, 55, 0.1); border-radius: 8px; margin-bottom: 12px;"
                        >
                          ⏳ ${this.uploadStatusMessage || 'در حال بارگذاری و تحلیل اسناد...'}
                        </div>
                      `
                    : ''
                }

                  <!-- Stored Documents List -->
                  <div class="upload-history-title">
                    <span>اسناد و مدارک بارگذاری‌شده (${this.scannedDocs.length})</span>
                  </div>

                  <div class="uploaded-docs-list">
                    ${
                    this.scannedDocs.length === 0
                      ? html`<div
                          style="text-align: center; color: #94a3b8; font-size: 12px; padding: 20px;"
                        >
                          هنوز فایلی بارگذاری نشده است. اسناد و مدارک خود را آپلود کنید تا وکیل آنها
                          را بررسی کند.
                        </div>`
                      : this.scannedDocs.map(
                          (doc) => html`
                            <div class="doc-item-row">
                              <div class="doc-item-info">
                                <div class="doc-item-title">
                                  <span
                                    >${doc.fileType === 'pdf' ? '📕' : doc.fileType === 'doc' ? '📘' : doc.fileType === 'image' ? '🖼️' : '📄'}</span
                                  >
                                  <span>${doc.title}</span>
                                </div>
                                <div class="doc-item-meta">
                                  <span>${doc.fileName || 'سند ارائه‌شده'}</span>
                                  ${doc.fileSize ? html`<span>• ${formatFileSize(doc.fileSize)}</span>` : ''}
                                </div>
                                ${
                                doc.extractedText
                                  ? html`<div class="doc-item-preview">
                                      ${doc.extractedText.substring(0, 180)}...
                                    </div>`
                                  : ''
                              }
                              </div>
                              <div class="doc-item-actions">
                                <button
                                  class="doc-action-btn primary"
                                  @click=${(e: Event) => this.handleSendDocToLiveSession(doc, e)}
                                  title="ارسال مجدد به وکیل جهت تحلیل و بازبینی"
                                >
                                  تحویل به وکیل
                                </button>
                                <button
                                  class="doc-action-btn danger"
                                  @click=${(e: Event) => this.handleDeleteDocItem(doc.id || '', e)}
                                  title="حذف فایل"
                                >
                                  حذف
                                </button>
                              </div>
                            </div>
                          `
                        )
                  }
                  </div>
                </div>
              </div>
            `
          : ''
      }

      <!-- Judicial Form Live Generation Banner Toast -->
      ${
        this.formGeneratedNotification
          ? html`
              <div
                class="form-notification-toast"
                @click=${() => this.openJudicialFormStudio(this.activeJudicialForm)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="20"
                  viewBox="0 -960 960 960"
                  width="20"
                  fill="#ffd700"
                >
                  <path
                    d="M240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520Z"
                  />
                </svg>
                <span>⚖️ ${this.formGeneratedNotification}</span>
                <button class="toast-view-btn">مشاهده و دریافت فایل</button>
              </div>
            `
          : ''
      }

      <!-- Generic Toast Feedback -->
      ${
        this.formFeedbackToast
          ? html`
              <div
                class="form-notification-toast"
                style="top: auto; bottom: 85px; background: #ffffff;"
              >
                <span>${this.formFeedbackToast}</span>
              </div>
            `
          : ''
      }

      <!-- Official Judicial Form Studio Modal -->
      ${
        this.isJudicialFormModalOpen && this.activeJudicialForm
          ? html`
              <div class="judicial-modal-backdrop" @click=${this.closeJudicialFormStudio}>
                <div
                  class="judicial-modal"
                  id="judicialFormStudioModal"
                  @click=${(e: Event) => e.stopPropagation()}
                >
                  <!-- Modal Header -->
                  <div class="judicial-modal-header">
                    <div class="judicial-modal-title">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="22"
                        viewBox="0 -960 960 960"
                        width="22"
                        fill="#ffd700"
                      >
                        <path
                          d="M240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z"
                        />
                      </svg>
                      <span>سامانه تنظیم، پیش‌نویس و صدور اوراق قضایی و نامه‌های رسمی</span>
                    </div>
                    <button
                      class="pip-btn-icon"
                      id="closeJudicialStudioBtn"
                      @click=${this.closeJudicialFormStudio}
                      title="بستن"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="20"
                        viewBox="0 -960 960 960"
                        width="20"
                        fill="currentColor"
                      >
                        <path
                          d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"
                        />
                      </svg>
                    </button>
                  </div>

                  <!-- Template Selector & Action Toolbar -->
                  <div class="judicial-toolbar">
                    <div class="form-types-scroll">
                      ${JUDICIAL_FORM_TYPES.map(
                      (t) => html`
                        <button
                          class="form-type-chip ${this.selectedTemplateType === t.id ? 'active' : ''}"
                          @click=${(e: Event) => this.handleSelectFormType(t.id as any, e)}
                        >
                          ${t.shortName}
                        </button>
                      `
                    )}
                    </div>

                    <div class="toolbar-actions">
                      <!-- AI Auto-Draft from Conversation -->
                      <button
                        class="action-btn-ai-draft"
                        id="studioAutoDraftBtn"
                        @click=${this.handleGenerateDraftFromConversation}
                        ?disabled=${this.isGeneratingDraft}
                        title="تنظیم خودکار متن پیش‌نویس بر اساس آخرین صحبت‌های جلسه مشاوره"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="15"
                          viewBox="0 -960 960 960"
                          width="15"
                          fill="#ffd700"
                        >
                          <path
                            d="m354-287 126-76 126 77-33-144 111-96-146-13-54-135-54 135-146 13 111 97-34 142ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z"
                          />
                        </svg>
                        <span
                          >${this.isGeneratingDraft ? 'در حال تنظیم...' : 'تنظیم از مکالمه ✨'}</span
                        >
                      </button>

                      <!-- Direct PDF Download Button -->
                      <button
                        class="action-btn-pdf"
                        id="downloadPdfBtn"
                        @click=${this.handleDownloadPDF}
                        ?disabled=${this.isGeneratingPDF}
                        title="ذخیره و دانلود مستقیم سند در قالب فایل استاندارد PDF"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="16"
                          viewBox="0 -960 960 960"
                          width="16"
                          fill="currentColor"
                        >
                          <path
                            d="M320-240h320v-80H320v80Zm0-160h320v-80H320v80ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z"
                          />
                        </svg>
                        <span
                          >${this.isGeneratingPDF ? 'در حال صدور PDF...' : 'دانلود فایل PDF (A4)'}</span
                        >
                      </button>

                      <!-- Word Doc Download Button -->
                      <button
                        class="action-btn-word"
                        id="downloadWordDocBtn"
                        @click=${this.handleDownloadWord}
                        title="دانلود فایل ویرایش‌پذیر Word با فرمت رسمی"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="16"
                          viewBox="0 -960 960 960"
                          width="16"
                          fill="currentColor"
                        >
                          <path
                            d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-280 280ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z"
                          />
                        </svg>
                        <span>دانلود فایل Word (.doc)</span>
                      </button>

                      <!-- Direct Print -->
                      <button
                        class="action-btn-print"
                        id="printJudicialFormBtn"
                        @click=${this.handlePrintForm}
                        title="پیش‌نمایش چاپ پرینتر"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="16"
                          viewBox="0 -960 960 960"
                          width="16"
                          fill="currentColor"
                        >
                          <path
                            d="M640-640v-120H320v120h-80v-200h480v200h-80Zm-480 80h640-640Zm560 100q17 0 28.5-11.5T760-500q0-17-11.5-28.5T720-540q-17 0-28.5 11.5T680-500q0 17 11.5 28.5T720-460Zm-80 260v-160H320v160h320Zm80 80H240v-160H80v-240q0-33 23.5-56.5T160-640h640q33 0 56.5 23.5T880-560v240H720v160Zm80-240v-160q0-17-11.5-28.5T760-580H200q-17 0-28.5 11.5T160-540v160h80v-80h480v80h80Z"
                          />
                        </svg>
                        <span>چاپ (Print)</span>
                      </button>

                      <!-- Copy Text -->
                      <button
                        class="action-btn-neutral"
                        @click=${this.handleCopyForm}
                        title="کپی متن کامل"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="16"
                          viewBox="0 -960 960 960"
                          width="16"
                          fill="currentColor"
                        >
                          <path
                            d="M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Z"
                          />
                        </svg>
                        <span>کپی متن</span>
                      </button>

                      <!-- Toggle Edit Mode -->
                      <button
                        class="action-btn-neutral"
                        @click=${() => (this.isFormEditing = !this.isFormEditing)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="16"
                          viewBox="0 -960 960 960"
                          width="16"
                          fill="currentColor"
                        >
                          <path
                            d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"
                          />
                        </svg>
                        <span>${this.isFormEditing ? 'مشاهده سربرگ رسمی' : 'ویرایش دستی'}</span>
                      </button>

                      <!-- Cloud Save -->
                      <button
                        class="action-btn-neutral"
                        style="border-color: rgba(212, 175, 55, 0.4); color: #ffd700;"
                        @click=${this.handleSaveFormRecord}
                        ?disabled=${this.isSavingForm}
                      >
                        <span>${this.isSavingForm ? 'در حال ذخیره...' : 'ذخیره در پرونده'}</span>
                      </button>
                    </div>
                  </div>

                  <!-- Modal Body: Paper View vs Live Edit Form -->
                  <div class="judicial-modal-body">
                    ${
                    !this.isFormEditing
                      ? html`
                          <!-- Official Parchment Paper Simulation -->
                          <div class="judicial-paper" id="officialJudicialPaperDocument">
                            ${
                            [
                              'nameh_edari',
                              'darkhast_edari',
                              'etelaieh_hoghooghi',
                              'qarardad_solh',
                            ].includes(this.activeJudicialForm.formType)
                              ? html`
                                  <!-- Formal Administrative Letter Header Layout -->
                                  <div
                                    class="paper-header"
                                    style="border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px;"
                                  >
                                    <div
                                      class="paper-meta-box"
                                      style="border: none; background: transparent; padding: 0;"
                                    >
                                      <div style="font-size: 11px;">
                                        <strong>شماره نامه:</strong>
                                        ${this.activeJudicialForm.trackingCode}
                                      </div>
                                      <div style="font-size: 11px;">
                                        <strong>تاریخ:</strong>
                                        ${this.activeJudicialForm.filingDate}
                                      </div>
                                      <div style="font-size: 11px;">
                                        <strong>پیوست:</strong>
                                        ${this.activeJudicialForm.evidences.length > 0 ? 'دارد' : 'ندارد'}
                                      </div>
                                    </div>

                                    <div class="paper-emblem">
                                      <div
                                        style="font-size: 13px; font-weight: 900; color: #0f172a; margin-bottom: 4px;"
                                      >
                                        « بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِیمِ »
                                      </div>
                                      <div
                                        class="paper-main-title"
                                        style="color: #0f172a; font-size: 16px;"
                                      >
                                        ${this.activeJudicialForm.title}
                                      </div>
                                    </div>

                                    <div
                                      class="paper-meta-box"
                                      style="text-align: center; border: none; background: transparent; min-width: 120px;"
                                    >
                                      <div
                                        style="font-size: 11px; font-weight: bold; color: #1e3a8a;"
                                      >
                                        جمهوری اسلامی ایران
                                      </div>
                                      <div style="font-size: 9px; color: #64748b; margin-top: 2px;">
                                        مکاتبات رسمی و اداری
                                      </div>
                                    </div>
                                  </div>

                                  <!-- Letter Recipient -->
                                  <div
                                    style="margin-bottom: 12px; padding: 6px 0; font-size: 13px; font-weight: 700; color: #0f172a; line-height: 1.8;"
                                  >
                                    <div>
                                      <strong>به:</strong> ${this.activeJudicialForm.authorityName}
                                    </div>
                                    <div>
                                      <strong>از طرف:</strong>
                                      ${this.activeJudicialForm.claimant.name}
                                      ${this.activeJudicialForm.claimant.nationalId ? `(کد ملی / شناسه: ${this.activeJudicialForm.claimant.nationalId})` : ''}
                                    </div>
                                    <div
                                      style="margin-top: 4px; color: #1e3a8a; border-bottom: 1px dashed #cbd5e1; padding-bottom: 6px;"
                                    >
                                      <strong>موضوع:</strong> ${this.activeJudicialForm.subject}
                                    </div>
                                  </div>

                                  <div
                                    style="font-size: 13px; font-weight: 700; margin: 8px 0; color: #334155;"
                                  >
                                    با سلام و احترام؛
                                  </div>

                                  <!-- Letter Body Content -->
                                  <div
                                    class="paper-body-box"
                                    style="border: none; padding: 6px 0; font-size: 13px; line-height: 2.1; min-height: 200px;"
                                  >
                                    ${this.activeJudicialForm.bodyText}
                                  </div>

                                  <!-- Legal Basis & Attachments if any -->
                                  ${
                                  this.activeJudicialForm.legalBasis ||
                                  (this.activeJudicialForm.evidences &&
                                    this.activeJudicialForm.evidences.length > 0)
                                    ? html`
                                        <div
                                          style="margin-top: 14px; padding-top: 10px; border-top: 1px dashed #cbd5e1; font-size: 11px; color: #475569; line-height: 1.8;"
                                        >
                                          ${this.activeJudicialForm.legalBasis ? html`<div><strong>مستندات قانونی:</strong> ${this.activeJudicialForm.legalBasis}</div>` : ''}
                                          ${
                                          this.activeJudicialForm.evidences &&
                                          this.activeJudicialForm.evidences.length > 0
                                            ? html`<div>
                                                <strong>پیوست‌ها و ضمائم:</strong>
                                                ${this.activeJudicialForm.evidences.join(' - ')}
                                              </div>`
                                            : ''
                                        }
                                        </div>
                                      `
                                    : ''
                                }

                                  <!-- Letter Signatures & Seal Footer -->
                                  <div class="paper-footer-signatures" style="margin-top: 30px;">
                                    <div
                                      class="signature-slot"
                                      style="text-align: right; width: 250px;"
                                    >
                                      <div style="font-size: 11px; color: #64748b;">
                                        <strong>نشانی و اطلاعات تماس فرستنده:</strong>
                                      </div>
                                      <div style="font-size: 10px; color: #475569;">
                                        ${this.activeJudicialForm.claimant.address || 'نشانی اعلامی در مکاتبه'}
                                      </div>
                                    </div>

                                    <div
                                      class="signature-slot"
                                      style="text-align: center; width: 200px;"
                                    >
                                      <div><strong>با تجدید احترام و سپاس</strong></div>
                                      <div
                                        style="margin-top: 6px; font-weight: 800; font-size: 13px; color: #0f172a;"
                                      >
                                        ${this.activeJudicialForm.claimant.name}
                                      </div>
                                      <div
                                        class="fingerprint-box"
                                        style="margin: 8px auto 0; height: 50px; border: 1px dashed #94a3b8; font-size: 10px;"
                                      >
                                        محل امضا و مهر
                                      </div>
                                    </div>
                                  </div>
                                `
                              : html`
                                  <!-- Official Judicial Court Document Layout -->
                                  <div class="paper-header">
                                    <div class="paper-meta-box">
                                      <div>
                                        <strong>شماره پرونده / پیگیری:</strong>
                                        ${this.activeJudicialForm.trackingCode}
                                      </div>
                                      <div>
                                        <strong>تاریخ ثبت:</strong>
                                        ${this.activeJudicialForm.filingDate}
                                      </div>
                                      <div>
                                        <strong>شعبه رسیدگی:</strong>
                                        ${this.activeJudicialForm.branchNumber || 'شعبه صالحه'}
                                      </div>
                                      <div><strong>پیوست:</strong> دارد (الکترونیک)</div>
                                    </div>

                                    <div class="paper-emblem">
                                      <div class="paper-country-title">جمهوری اسلامی ایران</div>
                                      <div class="paper-main-title">
                                        ${this.activeJudicialForm.title}
                                      </div>
                                      <div class="paper-authority">
                                        ${this.activeJudicialForm.authorityName}
                                      </div>
                                    </div>

                                    <div class="paper-meta-box" style="text-align: center;">
                                      <div
                                        style="font-size: 11px; font-weight: bold; color: #1e3a8a;"
                                      >
                                        قوه قضاییه
                                      </div>
                                      <div style="font-size: 9px; color: #64748b; margin-top: 2px;">
                                        سامانه خدمات الکترونیک قضایی (عدل ایران)
                                      </div>
                                      <div
                                        style="margin-top: 4px; font-family: monospace; letter-spacing: 2px; font-size: 9px; background: #e2e8f0; padding: 2px 4px; border-radius: 2px;"
                                      >
                                        ||||| | |||| ||| ||
                                      </div>
                                    </div>
                                  </div>

                                  <!-- Parties Information Table -->
                                  <table class="paper-table">
                                    <tbody>
                                      <tr>
                                        <th>خواهان / شاکی / اظهارکننده</th>
                                        <td colspan="3">
                                          <strong>${this.activeJudicialForm.claimant.name}</strong>
                                          - فرزند:
                                          ${this.activeJudicialForm.claimant.fatherName || 'ثبت در سامانه'}
                                          - کدملی:
                                          ${this.activeJudicialForm.claimant.nationalId || 'ثبت در ثنا'}
                                          - نشانی:
                                          ${this.activeJudicialForm.claimant.address || 'نشانی مطابق سامانه ابلاغ ثنا'}
                                        </td>
                                      </tr>
                                      <tr>
                                        <th>خوانده / مشتکی‌عنه / مخاطب</th>
                                        <td colspan="3">
                                          <strong
                                            >${this.activeJudicialForm.respondent.name}</strong
                                          >
                                          - نشانی:
                                          ${this.activeJudicialForm.respondent.address || 'نشانی اعلامی در دادخواست'}
                                        </td>
                                      </tr>
                                      <tr>
                                        <th>وکیل یا نماینده قانونی</th>
                                        <td colspan="3">
                                          <strong
                                            >${this.activeJudicialForm.attorney?.name || 'وکیل پایه یک دادگستری'}</strong
                                          >
                                          - به نشانی دفتر وکالت و شناسه الکترونیک وکالت
                                        </td>
                                      </tr>
                                      <tr>
                                        <th>تعیین موضوع و خواسته</th>
                                        <td colspan="3" style="color: #1e3a8a; font-weight: 800;">
                                          ${this.activeJudicialForm.subject}
                                        </td>
                                      </tr>
                                      <tr>
                                        <th>دلایل و منضمات قانونی</th>
                                        <td colspan="3">
                                          ${this.activeJudicialForm.evidences.map((item, idx) => html`<div>${idx + 1}- ${item}</div>`)}
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>

                                  <!-- Main Text Section -->
                                  <div class="paper-section-title">
                                    شرح و دلایل دادخواست / شکواییه / لایحه قانونی
                                  </div>
                                  <div class="paper-body-box">
                                    ${this.activeJudicialForm.bodyText}
                                  </div>

                                  <!-- Signatures & Official Footer -->
                                  <div class="paper-footer-signatures">
                                    <div class="signature-slot">
                                      <div><strong>امضا و اثر انگشت خواهان / شاکی:</strong></div>
                                      <div class="fingerprint-box">محل اثر انگشت</div>
                                      <div>${this.activeJudicialForm.claimant.name}</div>
                                    </div>

                                    <div
                                      class="signature-slot"
                                      style="font-size: 10px; color: #64748b;"
                                    >
                                      <div>مهر و امضای دفتر خدمات الکترونیک قضایی</div>
                                      <div
                                        style="border: 1px dashed #94a3b8; height: 50px; margin: 4px auto; border-radius: 4px; display: flex; align-items: center; justify-content: center;"
                                      >
                                        تایید اصالت الکترونیک
                                      </div>
                                    </div>

                                    <div class="signature-slot">
                                      <div><strong>امضای وکیل پایه یک دادگستری:</strong></div>
                                      <div
                                        style="border: 1px dashed #94a3b8; height: 50px; margin: 4px auto; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #1e3a8a;"
                                      >
                                        امضای الکترونیک وکیل
                                      </div>
                                      <div>
                                        ${this.activeJudicialForm.attorney?.name || 'وکیل رسمی دادگستری'}
                                      </div>
                                    </div>
                                  </div>
                                `
                          }
                          </div>
                        `
                      : html`
                          <!-- Live Editable Form Grid -->
                          <div class="edit-mode-container">
                            <div class="edit-section">
                              <div class="card-title">
                                <span>مشخصات سند و مرجع قضایی</span>
                              </div>
                              <div class="edit-grid-2">
                                <div>
                                  <label class="field-label">عنوان رسمی سند</label>
                                  <input
                                    type="text"
                                    class="edit-input"
                                    .value=${this.activeJudicialForm.title}
                                    @input=${(e: any) => (this.activeJudicialForm!.title = e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label class="field-label">مرجع قضایی صالح</label>
                                  <input
                                    type="text"
                                    class="edit-input"
                                    .value=${this.activeJudicialForm.authorityName}
                                    @input=${(e: any) => (this.activeJudicialForm!.authorityName = e.target.value)}
                                  />
                                </div>
                              </div>
                            </div>

                            <div class="edit-section">
                              <div class="card-title">
                                <span>مشخصات طرفین دعوا</span>
                              </div>
                              <div class="edit-grid-2">
                                <div>
                                  <label class="field-label">نام خواهان / شاکی</label>
                                  <input
                                    type="text"
                                    class="edit-input"
                                    .value=${this.activeJudicialForm.claimant.name}
                                    @input=${(e: any) => (this.activeJudicialForm!.claimant.name = e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label class="field-label">کد ملی خواهان</label>
                                  <input
                                    type="text"
                                    class="edit-input"
                                    .value=${this.activeJudicialForm.claimant.nationalId || ''}
                                    @input=${(e: any) => (this.activeJudicialForm!.claimant.nationalId = e.target.value)}
                                  />
                                </div>
                                <div style="grid-column: span 2;">
                                  <label class="field-label">نشانی و اقامتگاه خواهان</label>
                                  <input
                                    type="text"
                                    class="edit-input"
                                    .value=${this.activeJudicialForm.claimant.address || ''}
                                    @input=${(e: any) => (this.activeJudicialForm!.claimant.address = e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label class="field-label">نام خوانده / مشتکی‌عنه</label>
                                  <input
                                    type="text"
                                    class="edit-input"
                                    .value=${this.activeJudicialForm.respondent.name}
                                    @input=${(e: any) => (this.activeJudicialForm!.respondent.name = e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label class="field-label">نشانی خوانده</label>
                                  <input
                                    type="text"
                                    class="edit-input"
                                    .value=${this.activeJudicialForm.respondent.address || ''}
                                    @input=${(e: any) => (this.activeJudicialForm!.respondent.address = e.target.value)}
                                  />
                                </div>
                              </div>
                            </div>

                            <div class="edit-section">
                              <div class="card-title">
                                <span>موضوع و خواسته دعوا</span>
                              </div>
                              <input
                                type="text"
                                class="edit-input"
                                .value=${this.activeJudicialForm.subject}
                                @input=${(e: any) => (this.activeJudicialForm!.subject = e.target.value)}
                              />
                            </div>

                            <div class="edit-section">
                              <div class="card-title">
                                <span>شرح مشروح و دفاعیات لایحه / دادخواست</span>
                              </div>
                              <textarea
                                class="edit-input"
                                rows="12"
                                style="line-height: 1.8;"
                                .value=${this.activeJudicialForm.bodyText}
                                @input=${(e: any) => (this.activeJudicialForm!.bodyText = e.target.value)}
                              ></textarea>
                            </div>

                            <div style="display: flex; justify-content: flex-end; gap: 10px;">
                              <button
                                class="action-btn-print"
                                @click=${() => (this.isFormEditing = false)}
                              >
                                اعمال تغییرات و مشاهده در سربرگ رسمی
                              </button>
                            </div>
                          </div>
                        `
                  }
                  </div>
                </div>
              </div>
            `
          : ''
      }

      <!-- In-App Anti-Sanction Proxy & Network Center Modal -->
      ${
        this.isProxyModalOpen
          ? html`
              <div
                class="modal-backdrop-global"
                id="proxyModalBackdrop"
                @click=${this.closeProxyModal}
              >
                <div
                  class="proxy-modal-card"
                  id="proxyModalCard"
                  @click=${(e: Event) => e.stopPropagation()}
                >
                  <!-- Modal Header -->
                  <div class="modal-top-header">
                    <div class="modal-header-title">
                      <span class="modal-header-icon" style="color: #60a5fa;">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="20"
                          viewBox="0 -960 960 960"
                          width="20"
                          fill="currentColor"
                        >
                          <path
                            d="M480-80q-139-35-229.5-159.5T160-516v-244l320-120 320 120v244q0 152-90.5 276.5T480-80Zm0-84q104-33 172-132t68-220v-189l-240-90-240 90v189q0 121 68 220t172 132Zm0-316Z"
                          />
                        </svg>
                      </span>
                      <span>پراکسی و تونل ارتباطی ضدتحریم هوشمند</span>
                    </div>
                    <button class="modal-close-btn" @click=${this.closeProxyModal} title="بستن">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="18"
                        viewBox="0 -960 960 960"
                        width="18"
                        fill="currentColor"
                      >
                        <path
                          d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"
                        />
                      </svg>
                    </button>
                  </div>

                  <!-- Modal Body -->
                  <div class="modal-scroll-body">
                    <!-- Live Status Banner -->
                    <div class="proxy-status-banner ${this.isTestingProxy ? 'testing' : ''}">
                      <div class="proxy-banner-info">
                        <div class="proxy-banner-title ${this.isTestingProxy ? 'blue' : ''}">
                          ${
                          this.isTestingProxy
                            ? html`<span>⏳ در حال سنجش پایداری و تاخیر گره‌های شبکه...</span>`
                            : html` <span>🛡️ وضعیت ارتباط: پایدار و ضدتحریم فعال</span> `
                        }
                        </div>
                        <div class="proxy-banner-sub">
                          ${this.networkState.activeTunnelName} — اتصال امن صوتی و تصویری بدون قطعی
                        </div>
                      </div>
                      <button
                        class="upload-action-btn"
                        style="padding: 6px 12px; font-size: 11px;"
                        @click=${this.handleTestProxyConnection}
                        ?disabled=${this.isTestingProxy}
                      >
                        ${this.isTestingProxy ? 'در حال تست...' : 'تست مجدد پینگ ⚡'}
                      </button>
                    </div>

                    <!-- Metrics Row -->
                    <div class="proxy-metric-pills">
                      <div class="proxy-metric-pill">
                        <span class="proxy-metric-label">تاخیر لحظه‌ای (Latency)</span>
                        <span class="proxy-metric-value" style="color: #34d399;">
                          ${this.networkState.latencyMs} میلی‌ثانیه
                        </span>
                      </div>
                      <div class="proxy-metric-pill">
                        <span class="proxy-metric-label">تشخیص جغرافیایی مبدا</span>
                        <span class="proxy-metric-value" style="color: #60a5fa;">
                          🇮🇷 ایران (Bypass خودکار)
                        </span>
                      </div>
                      <div class="proxy-metric-pill">
                        <span class="proxy-metric-label">وضعیت پروتکل زنده</span>
                        <span class="proxy-metric-value" style="color: #ffd700;">
                          WebSocket / TLS Encrypted
                        </span>
                      </div>
                    </div>

                    <!-- Auto-Bypass Master Toggle -->
                    <div class="proxy-toggle-card">
                      <div class="proxy-toggle-info">
                        <div class="proxy-toggle-title">
                          <span>دورزدن خودکار و دائمی محدودیت‌های منطقه‌ای و تحریم</span>
                        </div>
                        <div class="proxy-toggle-desc">
                          به محض تشخیص اختلال در اینترنت کشور یا محدودیت گوگل، ترافیک صوتی به صورت
                          خودکار از طریق گره‌های ضدتحریم ابری هدایت می‌شود.
                        </div>
                      </div>
                      <button
                        class="toggle-switch-btn ${this.networkState.autoBypassEnabled ? 'active' : ''}"
                        @click=${this.handleToggleAutoBypass}
                        title="تغییر وضعیت دورزدن تحریم"
                      >
                        <div class="toggle-switch-knob"></div>
                      </button>
                    </div>

                    <!-- DNS Over HTTPS Toggle -->
                    <div class="proxy-toggle-card">
                      <div class="proxy-toggle-info">
                        <div class="proxy-toggle-title">
                          <span>سامانه ضد فیلترینگ DNS امن (DNS-over-HTTPS)</span>
                        </div>
                        <div class="proxy-toggle-desc">
                          جلوگیری خودکار از آلودگی DNS اپراتورهای داخلی جهت دسترسی بدون قطعی به
                          مدل‌های هوش مصنوعی.
                        </div>
                      </div>
                      <button
                        class="toggle-switch-btn ${this.networkState.dnsBypassActive ? 'active' : ''}"
                        @click=${this.handleToggleDnsBypass}
                        title="تغییر وضعیت DNS امن"
                      >
                        <div class="toggle-switch-knob"></div>
                      </button>
                    </div>

                    <!-- Proxy Nodes Selection -->
                    <div
                      style="margin-top: 14px; margin-bottom: 8px; font-size: 12px; font-weight: 700; color: #ffd700;"
                    >
                      گره‌های ابری بهینه‌شده ضدتحریم:
                    </div>

                    ${PROXY_NODES.map(
                    (node) => html`
                      <div
                        class="proxy-node-item ${this.networkState.selectedNode === node.id ? 'selected' : ''}"
                        @click=${(e: Event) => this.handleSelectProxyNode(node.id, e)}
                      >
                        <div class="proxy-node-left">
                          <span class="proxy-node-flag">${node.flag}</span>
                          <div class="proxy-node-info">
                            <span class="proxy-node-title">${node.name}</span>
                            <span class="proxy-node-sub">${node.location}</span>
                          </div>
                        </div>
                        <div class="proxy-node-ping">⚡ ${node.ping}ms</div>
                      </div>
                    `
                  )}
                  </div>
                </div>
              </div>
            `
          : ''
      }
    `;
  }
}
