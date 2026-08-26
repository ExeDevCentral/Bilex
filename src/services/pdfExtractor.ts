import * as pdfjsLib from 'pdfjs-dist';
import type { DocumentMetadata, ParagraphPair } from '../types';
import { performOCR } from './ocrService';
import type { OCRProgressCallback } from './ocrService';
import { parseRawTextToParagraphs, calculateTextStats } from './paragraphParser';

// Set up pdf.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
}

export interface PDFExtractionProgress {
  stage: 'loading' | 'extracting' | 'rendering' | 'ocr';
  currentPage: number;
  totalPages: number;
  message: string;
  percent: number;
}

export interface PDFExtractionOptions {
  forceOcr?: boolean;
  ocrLanguage?: string;
  onProgress?: (progress: PDFExtractionProgress) => void;
}

/**
 * Extracts text and paragraphs from a PDF file with automatic OCR fallback for scanned pages
 */
export async function extractTextFromPDF(
  file: File | ArrayBuffer,
  options: PDFExtractionOptions = {}
): Promise<{ pairs: ParagraphPair[]; metadata: DocumentMetadata }> {
  const { forceOcr = false, ocrLanguage = 'eng+spa', onProgress } = options;

  let arrayBuffer: ArrayBuffer;
  let fileName = 'documento.pdf';
  let fileSize = 0;

  if (file instanceof File) {
    fileName = file.name;
    fileSize = file.size;
    arrayBuffer = await file.arrayBuffer();
  } else {
    arrayBuffer = file;
    fileSize = arrayBuffer.byteLength;
  }

  onProgress?.({
    stage: 'loading',
    currentPage: 0,
    totalPages: 0,
    message: 'Cargando y analizando estructura del PDF...',
    percent: 5,
  });

  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdfDoc = await loadingTask.promise;
  const totalPages = pdfDoc.numPages;

  const allPairs: ParagraphPair[] = [];
  let isScannedDoc = false;
  let totalConfidence = 0;
  let ocrPageCount = 0;

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const progressPercent = Math.round(10 + ((pageNum - 1) / totalPages) * 80);

    onProgress?.({
      stage: 'extracting',
      currentPage: pageNum,
      totalPages,
      message: `Procesando página ${pageNum} de ${totalPages}...`,
      percent: progressPercent,
    });

    let extractedText = '';
    let pageConfidence: number | undefined = undefined;

    // Check if we should extract direct text
    if (!forceOcr) {
      try {
        const textContent = await page.getTextContent();
        let lastY: number | null = null;
        const textChunks: string[] = [];

        for (const item of textContent.items) {
          if ('str' in item) {
            const currentY = item.transform ? item.transform[5] : null;
            if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 8) {
              // Line break or paragraph gap
              if (Math.abs(currentY - lastY) > 18) {
                textChunks.push('\n\n');
              } else {
                textChunks.push('\n');
              }
            } else if (textChunks.length > 0 && !textChunks[textChunks.length - 1].endsWith('\n')) {
              textChunks.push(' ');
            }
            textChunks.push(item.str);
            lastY = currentY;
          }
        }
        extractedText = textChunks.join('').trim();
      } catch (err) {
        console.warn(`Error extracting text directly from page ${pageNum}, falling back to OCR:`, err);
        extractedText = '';
      }
    }

    // If text is suspiciously empty or too short (< 25 chars) or forced, run OCR on rendered canvas
    const needsOCR = forceOcr || extractedText.length < 25;

    if (needsOCR) {
      isScannedDoc = true;
      onProgress?.({
        stage: 'rendering',
        currentPage: pageNum,
        totalPages,
        message: `Página ${pageNum} escaneada: Renderizando para OCR...`,
        percent: progressPercent + 2,
      });

      // Render page to canvas at 2x scale for sharp OCR
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (ctx) {
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Render PDF page to canvas
        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };
        // @ts-expect-error pdfjs types render compatibility
        await page.render(renderContext).promise;

        // Perform OCR on the rendered canvas
        const ocrProgressCallback: OCRProgressCallback = (ocrPct, statusText) => {
          onProgress?.({
            stage: 'ocr',
            currentPage: pageNum,
            totalPages,
            message: `Página ${pageNum} (OCR): ${statusText}`,
            percent: Math.min(95, progressPercent + Math.round((ocrPct / 100) * (80 / totalPages))),
          });
        };

        const ocrResult = await performOCR(canvas, ocrLanguage, ocrProgressCallback);
        extractedText = ocrResult.text;
        pageConfidence = ocrResult.confidence;
        totalConfidence += ocrResult.confidence;
        ocrPageCount++;

        // Clean up canvas
        canvas.width = 0;
        canvas.height = 0;
      }
    }

    // Segment text into structured paragraph pairs
    const pagePairs = parseRawTextToParagraphs(
      extractedText,
      pageNum,
      allPairs.length,
      pageConfidence
    );

    allPairs.push(...pagePairs);
  }

  const { charCount, wordCount } = calculateTextStats(allPairs);
  const avgConfidence = ocrPageCount > 0 ? Math.round(totalConfidence / ocrPageCount) : undefined;

  const metadata: DocumentMetadata = {
    fileName,
    fileSize,
    fileType: 'pdf',
    totalPages,
    totalCharacters: charCount,
    totalWords: wordCount,
    isScanned: isScannedDoc,
    avgConfidence,
    uploadedAt: new Date().toISOString(),
  };

  onProgress?.({
    stage: 'extracting',
    currentPage: totalPages,
    totalPages,
    message: 'Extracción completada. Listo para traducir.',
    percent: 100,
  });

  return {
    pairs: allPairs,
    metadata,
  };
}

/**
 * Extracts text and paragraphs from an image file (JPG, PNG, WebP, etc.) via OCR
 */
export async function extractTextFromImage(
  file: File,
  options: { ocrLanguage?: string; onProgress?: (progress: PDFExtractionProgress) => void } = {}
): Promise<{ pairs: ParagraphPair[]; metadata: DocumentMetadata }> {
  const { ocrLanguage = 'eng+spa', onProgress } = options;

  onProgress?.({
    stage: 'ocr',
    currentPage: 1,
    totalPages: 1,
    message: 'Procesando imagen con OCR...',
    percent: 15,
  });

  const ocrProgressCallback: OCRProgressCallback = (pct, statusText) => {
    onProgress?.({
      stage: 'ocr',
      currentPage: 1,
      totalPages: 1,
      message: `Imagen (OCR): ${statusText}`,
      percent: Math.min(95, 15 + Math.round(pct * 0.8)),
    });
  };

  const ocrResult = await performOCR(file, ocrLanguage, ocrProgressCallback);
  const pairs = parseRawTextToParagraphs(ocrResult.text, 1, 0, ocrResult.confidence);
  const { charCount, wordCount } = calculateTextStats(pairs);

  const metadata: DocumentMetadata = {
    fileName: file.name,
    fileSize: file.size,
    fileType: 'image',
    totalPages: 1,
    totalCharacters: charCount,
    totalWords: wordCount,
    isScanned: true,
    avgConfidence: Math.round(ocrResult.confidence),
    uploadedAt: new Date().toISOString(),
  };

  onProgress?.({
    stage: 'ocr',
    currentPage: 1,
    totalPages: 1,
    message: 'Extracción de imagen completada.',
    percent: 100,
  });

  return { pairs, metadata };
}
