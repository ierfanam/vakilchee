/**
 * Local Document & File Upload Processor for AI Lawyer
 */

export interface ProcessedDocument {
  title: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileDataUrl?: string;
  extractedText: string;
  analysis: string;
  source: 'local_upload' | 'camera_scan';
  previewUrl?: string;
}

export interface StoredDocItem {
  id: string;
  title: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  fileDataUrl?: string;
  extractedText: string;
  analysis?: string;
  source?: 'local_upload' | 'camera_scan' | string;
  previewUrl?: string;
  createdAt?: any;
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 بایت';
  const k = 1024;
  const sizes = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Reads and processes a local file from internal storage
 */
export async function processLocalDocumentFile(file: File): Promise<ProcessedDocument> {
  const isImage = file.type.startsWith('image/');
  const isText = file.type === 'text/plain' || file.name.endsWith('.txt');
  const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
  const isWord = file.name.endsWith('.doc') || file.name.endsWith('.docx');

  let fileDataUrl = '';
  let extractedText = '';
  let analysis = '';

  if (isImage) {
    fileDataUrl = await readFileAsDataURL(file);
    extractedText = `تصویر سند یا قرارداد بارگذاری‌شده: ${file.name}`;
    analysis = `تصویر با کیفیت سند «${file.name}» از حافظه دستگاه بارگذاری گردید و جهت موشکافی به وکیل تحویل داده شد.`;
  } else if (isText) {
    extractedText = await readFileAsText(file);
    analysis = `متن کامل سند «${file.name}» استخراج و به پرونده افزوده شد.`;
  } else if (isPdf || isWord) {
    try {
      const textPreview = await readFileAsText(file);
      if (textPreview && textPreview.length > 30) {
        extractedText = textPreview.substring(0, 5000);
      } else {
        extractedText = `سند رسمی الکترونیک: ${file.name} (حجم: ${formatFileSize(file.size)})`;
      }
    } catch {
      extractedText = `فایل ${isPdf ? 'PDF' : 'Word'} بارگذاری‌شده: ${file.name}`;
    }
    fileDataUrl = await readFileAsDataURL(file);
    analysis = `سند «${file.name}» از حافظه داخلی بارگذاری شد و در پرونده موکل به ثبت رسید.`;
  } else {
    fileDataUrl = await readFileAsDataURL(file);
    extractedText = `فایل پیوست: ${file.name}`;
    analysis = `فایل ضمیمه با موفقیت ثبت گردید.`;
  }

  // Derive a clean Persian title from file name
  let title = file.name;
  if (
    file.name.includes('contract') ||
    file.name.includes('ghardad') ||
    file.name.includes('قرارداد')
  ) {
    title = `قرارداد: ${file.name}`;
  } else if (
    file.name.includes('check') ||
    file.name.includes('cheque') ||
    file.name.includes('چک')
  ) {
    title = `چک صیادی / سند تجاری: ${file.name}`;
  } else if (file.name.includes('sanad') || file.name.includes('سند')) {
    title = `سند مالکیت / ثبتی: ${file.name}`;
  } else if (
    file.name.includes('dadnameh') ||
    file.name.includes('دادنامه') ||
    file.name.includes('hokm') ||
    file.name.includes('حکم')
  ) {
    title = `دادنامه و رأی دادگاه: ${file.name}`;
  }

  return {
    title,
    fileName: file.name,
    fileType: file.type || 'application/octet-stream',
    fileSize: file.size,
    fileDataUrl,
    extractedText,
    analysis,
    source: 'local_upload',
    previewUrl: isImage ? fileDataUrl : undefined,
  };
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => resolve('');
    reader.readAsText(file, 'utf-8');
  });
}
