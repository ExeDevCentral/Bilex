import { createWorker } from 'tesseract.js';
import type { Worker } from 'tesseract.js';

export interface OCRProgressCallback {
  (progress: number, statusText: string): void;
}

export interface OCRResult {
  text: string;
  confidence: number;
}

let activeWorker: Worker | null = null;
let currentLanguage = '';

/**
 * Initializes or reuses a Tesseract OCR worker
 */
async function getWorker(language = 'eng+spa', onProgress?: OCRProgressCallback): Promise<Worker> {
  if (activeWorker && currentLanguage === language) {
    return activeWorker;
  }

  if (activeWorker) {
    await activeWorker.terminate();
    activeWorker = null;
  }

  onProgress?.(10, 'Cargando motor OCR Tesseract WebAssembly...');

  // Initialize worker with target languages
  const worker = await createWorker(language, 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        const pct = Math.round(m.progress * 100);
        onProgress?.(pct, `Reconociendo texto en imagen (${pct}%)...`);
      } else if (m.status === 'loading tesseract core' || m.status === 'loading language traineddata') {
        onProgress?.(30, `Cargando diccionarios OCR (${language})...`);
      } else if (m.status === 'initializing api') {
        onProgress?.(45, 'Inicializando motor OCR...');
      }
    },
  });

  activeWorker = worker;
  currentLanguage = language;
  return worker;
}

/**
 * Runs OCR on an image (File, Blob, Canvas or image URL)
 */
export async function performOCR(
  imageSource: string | HTMLCanvasElement | Blob | File,
  language = 'eng+spa',
  onProgress?: OCRProgressCallback
): Promise<OCRResult> {
  try {
    const worker = await getWorker(language, onProgress);
    onProgress?.(50, 'Escaneando caracteres y palabras...');

    const result = await worker.recognize(imageSource);
    const text = result.data.text ? result.data.text.trim() : '';
    const confidence = typeof result.data.confidence === 'number' ? result.data.confidence : 85;

    return {
      text,
      confidence,
    };
  } catch (error) {
    console.error('Error during Tesseract OCR recognition:', error);
    throw new Error(`Error en el reconocimiento OCR: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Releases worker resources when needed
 */
export async function terminateOCRWorker(): Promise<void> {
  if (activeWorker) {
    await activeWorker.terminate();
    activeWorker = null;
    currentLanguage = '';
  }
}
