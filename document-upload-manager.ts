/**
 * Advanced Document, Image & Text File Processor for AI Lawyer
 * Supports any file format: Images (OCR), PDFs, Word documents (.docx/.doc),
 * Plain Text, Code, CSV, JSON, Markdown, RTF, etc.
 * Provides verbatim content extraction, in-depth legal analysis, and speech narration.
 */

import { GoogleGenAI } from '@google/genai';

export interface ProcessedDocument {
  id?: string;
  title: string;
  fileName: string;
  fileType: string;
  fileCategory: 'image' | 'pdf' | 'doc' | 'text' | 'code' | 'other';
  fileSize: number;
  fileDataUrl?: string;
  extractedText: string;
  analysis: string;
  summary?: string;
  parties?: string[];
  keyDates?: string[];
  legalRisks?: string[];
  recommendations?: string[];
  isOcrCompleted: boolean;
  source: 'local_upload' | 'camera_scan';
  previewUrl?: string;
  timestamp: number;
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 بایت';
  const k = 1024;
  const sizes = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Detect file category based on extension and mimeType
 */
export function detectFileCategory(fileName: string, mimeType: string): 'image' | 'pdf' | 'doc' | 'text' | 'code' | 'other' {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  if (
    mimeType.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg', 'ico', 'tiff', 'tif', 'avif', 'heic'].includes(ext)
  ) {
    return 'image';
  }

  if (mimeType === 'application/pdf' || ext === 'pdf') {
    return 'pdf';
  }

  if (
    mimeType.includes('word') ||
    mimeType.includes('officedocument') ||
    ['doc', 'docx', 'dotx', 'rtf', 'odt'].includes(ext)
  ) {
    return 'doc';
  }

  if (
    ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'rs', 'php', 'rb', 'swift', 'kt', 'sh', 'bash', 'sql'].includes(ext)
  ) {
    return 'code';
  }

  if (
    mimeType.startsWith('text/') ||
    ['txt', 'md', 'markdown', 'json', 'csv', 'tsv', 'xml', 'html', 'htm', 'log', 'ini', 'conf', 'yaml', 'yml'].includes(ext)
  ) {
    return 'text';
  }

  return 'other';
}

/**
 * Derives a formal Persian title from file name and category
 */
export function derivePersianDocTitle(fileName: string, category: string): string {
  const lower = fileName.toLowerCase();

  if (lower.includes('contract') || lower.includes('ghardad') || lower.includes('qarardad') || lower.includes('قرارداد')) {
    return `قرارداد: ${fileName}`;
  }
  if (lower.includes('check') || lower.includes('cheque') || lower.includes('چک')) {
    return `چک تجاری / صیادی: ${fileName}`;
  }
  if (lower.includes('sanad') || lower.includes('سند') || lower.includes('melk') || lower.includes('ملک')) {
    return `سند مالکیت / ثبتی: ${fileName}`;
  }
  if (lower.includes('dadnameh') || lower.includes('دادنامه') || lower.includes('hokm') || lower.includes('حکم') || lower.includes('ray') || lower.includes('رای')) {
    return `دادنامه و رأی مرجع قضایی: ${fileName}`;
  }
  if (lower.includes('ezharnameh') || lower.includes('اظهارنامه')) {
    return `اظهارنامه رسمی: ${fileName}`;
  }
  if (lower.includes('layehe') || lower.includes('لایحه')) {
    return `لایحه دفاعیه: ${fileName}`;
  }
  if (lower.includes('dadkhast') || lower.includes('دادخواست')) {
    return `دادخواست حقوقی: ${fileName}`;
  }
  if (lower.includes('shekayat') || lower.includes('شکایت') || lower.includes('shakva')) {
    return `شکواییه کیفری: ${fileName}`;
  }
  if (lower.includes('nameh') || lower.includes('نامه') || lower.includes('edari')) {
    return `مکاتبه اداری / سازمانی: ${fileName}`;
  }
  if (lower.includes('factor') || lower.includes('فاکتور') || lower.includes('soorat') || lower.includes('صورتحساب')) {
    return `فاکتور و صورت‌حساب مالی: ${fileName}`;
  }

  switch (category) {
    case 'image':
      return `تصویر مدارک / سند: ${fileName}`;
    case 'pdf':
      return `سند الکترونیک PDF: ${fileName}`;
    case 'doc':
      return `سند متنی Word: ${fileName}`;
    case 'text':
      return `فایل متنی: ${fileName}`;
    case 'code':
      return `سورس کد / اسکریپت: ${fileName}`;
    default:
      return `مدرک پیوست: ${fileName}`;
  }
}

/**
 * Reads a local file as Data URL (Base64)
 */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Reads a local file as plain text (UTF-8)
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) || '');
    reader.onerror = () => resolve('');
    reader.readAsText(file, 'utf-8');
  });
}

/**
 * Reads a local file as ArrayBuffer
 */
export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Extracts raw textual strings from a Word (.docx/.doc) or binary document
 */
export async function extractTextFromWordOrBinary(file: File): Promise<string> {
  try {
    const buffer = await readFileAsArrayBuffer(file);
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const rawString = decoder.decode(buffer);

    // If it's a DOCX (OpenXML ZIP archive), extract <w:t> tags
    if (rawString.includes('word/document.xml') || rawString.includes('<w:p') || rawString.includes('<w:t')) {
      const textMatches = rawString.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
      if (textMatches && textMatches.length > 0) {
        const textPieces = textMatches.map((m) => m.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
        const combined = textPieces.join(' ');
        if (combined.length > 30) {
          return combined;
        }
      }
    }

    // Secondary heuristic: extract readable Unicode Persian / Latin runs from binary
    const chunks = rawString.match(/[\u0600-\u06FF\u0750-\u077F\w\s.,;:!?()-]{4,}/g);
    if (chunks && chunks.length > 0) {
      const candidate = chunks.join('\n').trim();
      if (candidate.length > 40) {
        return candidate.substring(0, 10000);
      }
    }
  } catch (e) {
    console.warn('Binary word extraction fallback error:', e);
  }

  return '';
}

/**
 * Quick local heuristic legal analysis fallback in case API is unavailable or offline
 */
export function generateLocalHeuristicAnalysis(
  fileName: string,
  category: string,
  extractedText: string,
): {
  summary: string;
  analysis: string;
  parties: string[];
  keyDates: string[];
  legalRisks: string[];
  recommendations: string[];
} {
  const text = extractedText || '';
  const parties: string[] = [];
  const keyDates: string[] = [];
  const legalRisks: string[] = [];
  const recommendations: string[] = [];

  // Extract dates (e.g. 1402/10/12, 1403/05/20)
  const dateMatches = text.match(/(1[34]\d{2}[\/\-]\d{1,2}[\/\-]\d{1,2})/g);
  if (dateMatches) {
    dateMatches.slice(0, 5).forEach((d) => {
      if (!keyDates.includes(d)) keyDates.push(d);
    });
  }

  // Extract monetary amounts (e.g. ریال, تومان)
  const moneyMatches = text.match(/([\d,]{4,})\s*(ریال|تومان|میلیون|میلیارد)/g);

  // Check for common legal parties
  if (text.includes('کارفرما') || text.includes('پیمانکار')) {
    parties.push('کارفرما', 'پیمانکار');
  }
  if (text.includes('موجر') || text.includes('مستاجر')) {
    parties.push('موجر', 'مستاجر');
  }
  if (text.includes('خریدار') || text.includes('فروشنده')) {
    parties.push('خریدار', 'فروشنده');
  }
  if (text.includes('خواهان') || text.includes('خوانده')) {
    parties.push('خواهان', 'خوانده');
  }

  if (category === 'image') {
    legalRisks.push('کیفیت اسکن و خوانایی مهر و امضاها باید پیش از ارائه به دادگاه احراز گردد.');
    recommendations.push('اصل سند کاغذی را جهت انطباق با رونوشت در جلسه دادرسی نزد خود نگهداری فرمایید.');
  }

  if (moneyMatches && moneyMatches.length > 0) {
    legalRisks.push(`مبالغ مالی مندرج در متن شامل: ${moneyMatches.slice(0, 2).join(' - ')} نیازمند تطبیق با اسناد واریز بانکی است.`);
  }

  const summary = `سند «${fileName}» با فرمت ${category.toUpperCase()} با موفقیت ثبت و استخراج گردید. کلیه مندرجات در پرونده موکل لحاظ شد.`;
  const analysis = `تحلیل اولیه وکیل:
۱. مشخصات و ماهیت سند: مدرک بارگذاری‌شده «${fileName}» در دسته ${category} ثبت گردید.
۲. مندرجات و مستندات: ${text.length > 0 ? `حاوی ${text.length} کاراکتر متن قابل استخراج و تحلیل حقوقی.` : 'محتوای تصویری/اسنادی تحویل کارگروه وکیل گردید.'}
۳. وضعیت اعتباری: قابل استناد به عنوان دلیل یا اماره قضایی بر اساس ماده ۱۲۸۴ الی ۱۲۹۴ قانون مدنی و قوانین مربوطه.
۴. اقدامات بعدی: سند جهت طرح در جلسه مشاوره زنده یا پیوست به لوایح قضایی آماده‌سازی شد.`;

  return {
    summary,
    analysis,
    parties,
    keyDates,
    legalRisks,
    recommendations,
  };
}

/**
 * Main processor: Reads file, extracts content, analyzes with Gemini AI, and returns a ProcessedDocument
 */
export async function processLocalDocumentFile(
  file: File,
  geminiClient?: GoogleGenAI,
): Promise<ProcessedDocument> {
  const category = detectFileCategory(file.name, file.type);
  const title = derivePersianDocTitle(file.name, category);
  const fileDataUrl = await readFileAsDataURL(file);

  let extractedText = '';
  let localTextPreview = '';

  // 1. Initial local extraction based on format
  if (category === 'text' || category === 'code') {
    localTextPreview = await readFileAsText(file);
    extractedText = localTextPreview;
  } else if (category === 'doc') {
    localTextPreview = await extractTextFromWordOrBinary(file);
    extractedText = localTextPreview || `سند Word / متن اداری: ${file.name}`;
  } else if (category === 'pdf') {
    localTextPreview = await extractTextFromWordOrBinary(file);
    extractedText = localTextPreview ? localTextPreview.substring(0, 5000) : `سند رسمی الکترونیک PDF: ${file.name}`;
  } else if (category === 'image') {
    extractedText = `تصویر سند / قرارداد: ${file.name}`;
  } else {
    extractedText = `فایل ضمیمه: ${file.name}`;
  }

  // 2. Perform deep AI Multimodal Reading & Legal Analysis using Gemini
  let summary = '';
  let analysis = '';
  let parties: string[] = [];
  let keyDates: string[] = [];
  let legalRisks: string[] = [];
  let recommendations: string[] = [];
  let isOcrCompleted = false;

  // Attempt Gemini AI extraction & analysis
  if (geminiClient) {
    try {
      const base64Data = fileDataUrl.includes('base64,') ? fileDataUrl.split('base64,')[1] : '';

      const promptInstructions = `
شما «مشاور عالی حقوقی و سامانه هوشمند خوانش، OCR و تحلیل اسناد و اوراق رسمی ایران» هستید.
کاربر یک فایل با نام "${file.name}" و نوع "${file.type || category}" بارگذاری کرده است.

وظایف اصلی شما:
۱. خوانش و استخراج کلمه به کلمه و کامل متن (OCR دقیق فارسی، عربی و انگلیسی):
   تمام متن‌ها، تیترها، شماره‌ها، تاریخ‌ها، مشخصات طرفین، تعهدات، مبالغ، مهرها، امضاها، دست‌نویس‌ها و شروط را بدون هیچ دخل و تصرف یا خلاصه کردن در بخش "extractedText" استخراج کنید. اگر متن طولانی است، تمامی بندها را به صورت مرتب بنویسید.
۲. تحلیل موشکافانه حقوقی (Legal Analysis) در بخش "analysis":
   - نوع دقیق سند و جایگاه حقوقی آن (سند رسمی، سند عادی، چک صیادی، قرارداد، دادنامه، ابلاغیه، لایحه و...)
   - ارزیابی اعتبار، ارکان و شرایط صحت
   - بررسی تعهدات و حقوق هر یک از طرفین
   - نقاط قوت و ضعف حقوقی، ابهامات یا خطرات احتمالی
   - استنادات به قوانین مربوطه (قانون مدنی، قانون کار، آیین دادرسی مدنی، قانون تجارت و...)
۳. خلاصه اجرایی مختصر (۱ الی ۲ جمله) در بخش "summary"
۴. لیست طرفین دعوا یا قرارداد در بخش "parties"
۵. لیست تاریخ‌ها و مواعد مهم در بخش "keyDates"
۶. لیست ریسک‌ها و هشدارهای مهم حقوقی در بخش "legalRisks"
۷. لیست توصیه‌ها و راهکارهای اجرایی وکیل در بخش "recommendations"

پاسخ شما باید الزماً یک JSON معتبر با ساختار زیر باشد:
{
  "extractedText": "متن کامل کلمه به کلمه استخراج شده از سند...",
  "summary": "خلاصه اجرایی یک الی دو خطی...",
  "analysis": "تحلیل مشروح، جامع، مستدل و بندبندی‌شده وکیل...",
  "parties": ["نام شخص یا نهاد ۱", "نام شخص یا نهاد ۲"],
  "keyDates": ["تاریخ یا موعد ۱", "تاریخ ۲"],
  "legalRisks": ["ریسک یا هشدار ۱", "ریسک ۲"],
  "recommendations": ["راهکار یا اقدام ۱", "راهکار ۲"]
}
`;

      let aiParts: any[] = [];

      if (category === 'image') {
        const mimeType = file.type && file.type.startsWith('image/') ? file.type : 'image/jpeg';
        aiParts = [
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
          { text: promptInstructions },
        ];
      } else if (category === 'pdf') {
        aiParts = [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: base64Data,
            },
          },
          { text: promptInstructions },
        ];
      } else {
        // Text, Code, Word, or other
        const contentToSend = localTextPreview || extractedText;
        aiParts = [
          {
            text: `${promptInstructions}\n\n[محتوای خام استخراج‌شده از فایل]:\n${contentToSend.substring(0, 30000)}`,
          },
        ];
      }

      const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest'];
      let aiResponse: any = null;

      for (const modelName of candidateModels) {
        try {
          aiResponse = await geminiClient.models.generateContent({
            model: modelName,
            contents: { parts: aiParts },
            config: {
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          });
          if (aiResponse?.text) break;
        } catch (modelErr) {
          console.warn(`Model ${modelName} analysis attempt failed:`, modelErr);
        }
      }

      if (aiResponse?.text) {
        let jsonStr = aiResponse.text.trim();
        if (jsonStr.startsWith('```json')) {
          jsonStr = jsonStr.replace(/^```json/, '').replace(/```$/, '').trim();
        } else if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.replace(/^```/, '').replace(/```$/, '').trim();
        }

        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed.extractedText && parsed.extractedText.trim().length > 10) {
            extractedText = parsed.extractedText.trim();
            isOcrCompleted = true;
          }
          if (parsed.summary) summary = parsed.summary.trim();
          if (parsed.analysis) analysis = parsed.analysis.trim();
          if (Array.isArray(parsed.parties)) parties = parsed.parties;
          if (Array.isArray(parsed.keyDates)) keyDates = parsed.keyDates;
          if (Array.isArray(parsed.legalRisks)) legalRisks = parsed.legalRisks;
          if (Array.isArray(parsed.recommendations)) recommendations = parsed.recommendations;
        } catch (parseErr) {
          console.warn('Failed to parse AI JSON response, using text fallback:', parseErr);
          analysis = aiResponse.text;
        }
      }
    } catch (aiErr) {
      console.error('Gemini AI document processing error:', aiErr);
    }
  }

  // Fallback if AI was unavailable or fields are still empty
  if (!analysis) {
    const fallback = generateLocalHeuristicAnalysis(file.name, category, extractedText);
    summary = fallback.summary;
    analysis = fallback.analysis;
    if (parties.length === 0) parties = fallback.parties;
    if (keyDates.length === 0) keyDates = fallback.keyDates;
    if (legalRisks.length === 0) legalRisks = fallback.legalRisks;
    if (recommendations.length === 0) recommendations = fallback.recommendations;
  }

  return {
    title,
    fileName: file.name,
    fileType: file.type || category,
    fileCategory: category,
    fileSize: file.size,
    fileDataUrl,
    extractedText,
    analysis,
    summary,
    parties,
    keyDates,
    legalRisks,
    recommendations,
    isOcrCompleted,
    source: 'local_upload',
    previewUrl: category === 'image' ? fileDataUrl : undefined,
    timestamp: Date.now(),
  };
}

/**
 * Text-to-Speech (TTS) Narration Engine
 * Cleans text of markdown and speaks it aloud in Persian
 */
class DocumentAudioNarrationEngine {
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private isCurrentlySpeaking = false;
  private isPausedState = false;

  public isSpeaking(): boolean {
    return this.isCurrentlySpeaking && !this.isPausedState;
  }

  public isPaused(): boolean {
    return this.isPausedState;
  }

  /**
   * Cleans text for pleasant, natural speech synthesis
   */
  private cleanTextForSpeech(text: string): string {
    return text
      .replace(/[#*`_~>[\]()]/g, ' ')
      .replace(/https?:\/\/\S+/g, ' ')
      .replace(/[\r\n]+/g, ' . ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Reads the given document content or analysis out loud
   */
  public speak(
    text: string,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: any) => void,
  ): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onError) onError('Speech synthesis not supported in this browser');
      return;
    }

    this.stop();

    const cleaned = this.cleanTextForSpeech(text);
    if (!cleaned) {
      if (onEnd) onEnd();
      return;
    }

    // Split text into manageable sentences to prevent browser utterance timeouts
    const sentences = cleaned.match(/[^.!?،؛\n]+[.!?،؛\n]*/g) || [cleaned];
    let currentIndex = 0;

    this.isCurrentlySpeaking = true;
    this.isPausedState = false;
    if (onStart) onStart();

    const speakNextChunk = () => {
      if (!this.isCurrentlySpeaking) return;

      if (currentIndex >= sentences.length) {
        this.isCurrentlySpeaking = false;
        this.isPausedState = false;
        if (onEnd) onEnd();
        return;
      }

      const chunk = sentences[currentIndex].trim();
      currentIndex++;

      if (!chunk) {
        speakNextChunk();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunk);
      this.activeUtterance = utterance;

      // Select Persian voice or fallback
      const voices = window.speechSynthesis.getVoices();
      const persianVoice = voices.find((v) => v.lang.startsWith('fa') || v.lang.includes('IR'));
      if (persianVoice) {
        utterance.voice = persianVoice;
      }
      utterance.lang = 'fa-IR';
      utterance.rate = 0.95; // Steady, distinguished lawyer cadence
      utterance.pitch = 0.98;

      utterance.onend = () => {
        speakNextChunk();
      };

      utterance.onerror = (e) => {
        if (e.error === 'interrupted' || e.error === 'canceled') {
          this.isCurrentlySpeaking = false;
          return;
        }
        console.warn('Utterance speech error:', e);
        speakNextChunk();
      };

      window.speechSynthesis.speak(utterance);
    };

    speakNextChunk();
  }

  public pause(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      this.isPausedState = true;
    }
  }

  public resume(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
      this.isPausedState = false;
    }
  }

  public stop(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.isCurrentlySpeaking = false;
      this.isPausedState = false;
      this.activeUtterance = null;
      window.speechSynthesis.cancel();
    }
  }
}

export const documentAudioNarrator = new DocumentAudioNarrationEngine();
