export interface ParagraphPair {
  id: string;
  pageNumber: number;
  original: string;
  translated: string;
  status: 'pending' | 'translating' | 'done' | 'error';
  confidence?: number; // OCR confidence (0-100) if applicable
  isEdited?: boolean;
  errorMessage?: string;
}

export interface DetectedLanguageInfo {
  code: string;
  iso3: string;
  name: string;
  flag: string;
  isReliable: boolean;
}

export interface DocumentMetadata {
  fileName: string;
  fileSize: number;
  fileType: 'pdf' | 'image' | 'compiled-images';
  totalPages: number;
  totalCharacters: number;
  totalWords: number;
  isScanned: boolean;
  avgConfidence?: number;
  uploadedAt: string;
  detectedLang?: DetectedLanguageInfo;
  compiledPdfBlob?: Blob; // if generated from photos
}

export type ProcessingStage = 
  | 'idle'
  | 'compiling-images'
  | 'loading-file'
  | 'extracting-pdf'
  | 'rendering-canvas'
  | 'running-ocr'
  | 'detecting-lang'
  | 'segmenting'
  | 'translating'
  | 'ready'
  | 'error';

export interface ProcessingState {
  stage: ProcessingStage;
  progress: number; // 0 to 100
  statusMessage: string;
  details?: string;
  currentPage?: number;
  totalPages?: number;
  currentChunk?: number;
  totalChunks?: number;
  error?: string;
  lowConfidenceWarning?: boolean;
  avgConfidence?: number;
  detectedLang?: DetectedLanguageInfo;
}

export type TranslationProvider = 'deepl' | 'openai' | 'claude' | 'libretranslate' | 'mock';

export interface TranslationConfig {
  provider: TranslationProvider;
  sourceLang: string;
  targetLang: string;
  apiKey?: string;
  customApiUrl?: string; // e.g. for LibreTranslate self-hosted
  model?: string; // e.g. gpt-4o-mini or claude-3-5-haiku
  formality?: 'default' | 'more' | 'less';
  useServerless: boolean;
}

export interface LanguageOption {
  code: string;
  name: string;
  flag: string;
  deeplCode?: string;
  tesseractCode?: string;
}

export interface ExportOptions {
  format: 'pdf-bilingual' | 'pdf-untranslated' | 'txt-side-by-side' | 'txt-translated' | 'markdown' | 'json';
  includePageNumbers: boolean;
  includeMetadata: boolean;
  fontSize?: number;
}
