import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Header } from './components/Header';
import { DropzoneUpload } from './components/DropzoneUpload';
import { ProcessingProgress } from './components/ProcessingProgress';
import type { 
  ParagraphPair, 
  DocumentMetadata, 
  ProcessingState, 
  TranslationConfig 
} from './types';
import { extractTextFromPDF, extractTextFromImage } from './services/pdfExtractor';
import { translateDocumentParagraphs } from './services/translationService';
import { detectLanguageFromText } from './services/languageDetector';
import { getSampleDocument } from './utils/sampleDocument';

const DualReader = lazy(() => import('./components/DualReader'));
const SettingsModal = lazy(() => import('./components/SettingsModal'));
const ExportModal = lazy(() => import('./components/ExportModal'));

const STORAGE_CONFIG_KEY = 'dualdoc_translation_config';
const STORAGE_THEME_KEY = 'dualdoc_theme';

const DEFAULT_CONFIG: TranslationConfig = {
  provider: 'gemini',
  sourceLang: 'AUTO',
  targetLang: 'ES',
  apiKey: '',
  useServerless: true,
  model: 'gemini-3.6-flash',
};

export const App: React.FC = () => {
  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem(STORAGE_THEME_KEY) as 'dark' | 'light') || 'dark';
  });

  // Translation Config State
  const [config, setConfig] = useState<TranslationConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CONFIG_KEY);
      if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    } catch (e) {
      console.warn('Failed to load saved config:', e);
    }
    return DEFAULT_CONFIG;
  });

  // Document and Pairs State
  const [pairs, setPairs] = useState<ParagraphPair[]>([]);
  const [metadata, setMetadata] = useState<DocumentMetadata | null>(null);

  // Processing State
  const [processingState, setProcessingState] = useState<ProcessingState>({
    stage: 'idle',
    progress: 0,
    statusMessage: '',
  });

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Apply theme to html root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_THEME_KEY, theme);
  }, [theme]);

  // Save config to localStorage
  const handleSaveConfig = (newConfig: TranslationConfig) => {
    setConfig(newConfig);
    localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(newConfig));
  };

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Pipeline execution: translates extracted pairs
  const runTranslationPipeline = async (
    extractedPairs: ParagraphPair[],
    currentMetadata: DocumentMetadata,
    currentConfig: TranslationConfig
  ) => {
    if (extractedPairs.length === 0) {
      setProcessingState({
        stage: 'error',
        progress: 0,
        statusMessage: 'No se encontró texto en el documento.',
        error: 'El archivo no contiene texto legible ni imágenes con texto reconocible.',
      });
      return;
    }

    // Run client-side language detection with franc-min
    const fullExtractedText = extractedPairs.map((p) => p.original).join('\n\n');
    const detected = detectLanguageFromText(fullExtractedText);
    if (detected) {
      currentMetadata.detectedLang = detected;
      // If user had AUTO selected, set effective sourceLang or keep track
      if (currentConfig.sourceLang === 'AUTO') {
        currentConfig = { ...currentConfig, sourceLang: detected.code };
      }
    }

    setProcessingState((prev) => ({
      ...prev,
      stage: 'translating',
      progress: 30,
      statusMessage: `Iniciando traducción con ${currentConfig.provider.toUpperCase()}...`,
      detectedLang: detected || undefined,
      currentChunk: 0,
      totalChunks: 1,
    }));

    try {
      const translatedPairs = await translateDocumentParagraphs(
        extractedPairs,
        currentConfig,
        (chunk, total, updated) => {
          const transProgress = 30 + Math.round((chunk / total) * 70);
          setPairs(updated);
          setProcessingState((prev) => ({
            ...prev,
            stage: 'translating',
            progress: transProgress,
            statusMessage: `Traduciendo lote ${chunk} de ${total}...`,
            currentChunk: chunk,
            totalChunks: total,
          }));
        }
      );

      setPairs(translatedPairs);
      setMetadata(currentMetadata);
      setProcessingState({
        stage: 'ready',
        progress: 100,
        statusMessage: 'Traducción completada con éxito.',
        detectedLang: detected || undefined,
      });
    } catch (error: any) {
      console.error('Translation failed:', error);
      setProcessingState((prev) => ({
        ...prev,
        stage: 'error',
        statusMessage: 'Error al traducir el documento.',
        error: error.message || 'Fallo de conexión o clave API incorrecta.',
      }));
    }
  };

  // Handle uploaded file (PDF or Image or Compiled Images PDF)
  const handleFileSelect = async (
    file: File,
    options: { forceOcr: boolean; ocrLanguage: string; compiledPdfBlob?: Blob }
  ) => {
    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|bmp)$/i.test(file.name);
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');

    if (!isImage && !isPdf) {
      alert('Por favor selecciona un archivo PDF o una imagen (JPG, PNG, WebP).');
      return;
    }

    setProcessingState({
      stage: 'loading-file',
      progress: 5,
      statusMessage: `Leyendo archivo "${file.name}"...`,
    });

    try {
      let extracted: { pairs: ParagraphPair[]; metadata: DocumentMetadata };

      if (isPdf) {
        extracted = await extractTextFromPDF(file, {
          forceOcr: options.forceOcr,
          ocrLanguage: options.ocrLanguage,
          onProgress: (p) => {
            setProcessingState({
              stage: p.stage === 'ocr' ? 'running-ocr' : 'extracting-pdf',
              progress: Math.min(28, p.percent * 0.28),
              statusMessage: p.message,
              currentPage: p.currentPage,
              totalPages: p.totalPages,
            });
          },
        });
      } else {
        extracted = await extractTextFromImage(file, {
          ocrLanguage: options.ocrLanguage,
          onProgress: (p) => {
            setProcessingState({
              stage: 'running-ocr',
              progress: Math.min(28, p.percent * 0.28),
              statusMessage: p.message,
            });
          },
        });
      }

      if (options.compiledPdfBlob) {
        extracted.metadata.compiledPdfBlob = options.compiledPdfBlob;
        extracted.metadata.fileType = 'compiled-images';
      }

      setMetadata(extracted.metadata);
      setPairs(extracted.pairs);

      const hasLowConfidence =
        extracted.metadata.isScanned &&
        typeof extracted.metadata.avgConfidence === 'number' &&
        extracted.metadata.avgConfidence < 65;

      setProcessingState((prev) => ({
        ...prev,
        lowConfidenceWarning: hasLowConfidence,
        avgConfidence: extracted.metadata.avgConfidence,
      }));

      // Start translation pipeline
      await runTranslationPipeline(extracted.pairs, extracted.metadata, config);
    } catch (err: any) {
      console.error('File extraction error:', err);
      setProcessingState({
        stage: 'error',
        progress: 0,
        statusMessage: 'Error al procesar el archivo.',
        error: err.message || 'No se pudo leer el archivo.',
      });
    }
  };

  // Load quick test sample
  const handleLoadSample = async () => {
    const sample = getSampleDocument();
    setMetadata(sample.metadata);
    setPairs(sample.pairs);

    await runTranslationPipeline(sample.pairs, sample.metadata, config);
  };

  // Load project from JSON session file
  const handleLoadProjectJson = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.pairs || !data.metadata) {
        throw new Error('El archivo JSON no tiene el formato válido de DualDoc.');
      }

      setPairs(data.pairs);
      setMetadata(data.metadata);
      setProcessingState({
        stage: 'ready',
        progress: 100,
        statusMessage: 'Proyecto cargado correctamente.',
      });
    } catch (err: any) {
      alert(`Error al cargar el archivo JSON: ${err.message}`);
    }
  };

  // Update a single paragraph after manual edit
  const handleUpdateParagraph = (id: string, newTranslation: string) => {
    setPairs((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, translated: newTranslation, isEdited: true, status: 'done' }
          : p
      )
    );
  };

  // Re-translate a single paragraph
  const handleRetranslateParagraph = async (id: string) => {
    const targetPair = pairs.find((p) => p.id === id);
    if (!targetPair) return;

    setPairs((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'translating' } : p))
    );

    try {
      const updated = await translateDocumentParagraphs([targetPair], config);
      if (updated.length > 0) {
        setPairs((prev) =>
          prev.map((p) => (p.id === id ? { ...updated[0] } : p))
        );
      }
    } catch (err: any) {
      setPairs((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, status: 'error', errorMessage: err.message }
            : p
        )
      );
    }
  };

  const handleNewDocument = () => {
    setPairs([]);
    setMetadata(null);
    setProcessingState({
      stage: 'idle',
      progress: 0,
      statusMessage: '',
    });
  };

  const isProcessing =
    processingState.stage !== 'idle' &&
    processingState.stage !== 'ready' &&
    processingState.stage !== 'error';

  const showDualReader = metadata !== null && pairs.length > 0 && !isProcessing;

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <Header
        config={config}
        onConfigChange={handleSaveConfig}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onNewDocument={handleNewDocument}
        hasDocument={metadata !== null && pairs.length > 0}
        isProcessing={isProcessing}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 2 }}>
        {/* State 1: Dropzone Upload */}
        {!metadata && processingState.stage === 'idle' && (
          <DropzoneUpload
            onFileSelect={handleFileSelect}
            onLoadSample={handleLoadSample}
            onLoadProjectJson={handleLoadProjectJson}
            isProcessing={isProcessing}
          />
        )}

        {/* State 2: Processing Progress */}
        {isProcessing && (
          <ProcessingProgress
            state={processingState}
            onCancel={handleNewDocument}
          />
        )}

        {/* State 3: Dual Reader Workspace */}
        {showDualReader && (
          <Suspense
            fallback={
              <ProcessingProgress
                state={{
                  stage: 'translating',
                  progress: 95,
                  statusMessage: 'Cargando lector bilingüe...',
                }}
                onCancel={handleNewDocument}
              />
            }
          >
            <DualReader
              pairs={pairs}
              metadata={metadata}
              sourceLang={config.sourceLang}
              targetLang={config.targetLang}
              onUpdateParagraph={handleUpdateParagraph}
              onRetranslateParagraph={handleRetranslateParagraph}
            />
          </Suspense>
        )}

        {/* Error State if no document */}
        {!showDualReader && processingState.stage === 'error' && (
          <ProcessingProgress
            state={processingState}
            onRetry={() => {
              if (metadata && pairs.length > 0) {
                runTranslationPipeline(pairs, metadata, config);
              } else {
                handleNewDocument();
              }
            }}
            onCancel={handleNewDocument}
          />
        )}
      </main>

      {/* Settings Modal */}
      <Suspense fallback={null}>
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          config={config}
          onSaveConfig={handleSaveConfig}
        />
      </Suspense>

      {/* Export Modal */}
      {metadata && (
        <Suspense fallback={null}>
          <ExportModal
            isOpen={isExportOpen}
            onClose={() => setIsExportOpen(false)}
            pairs={pairs}
            metadata={metadata}
          />
        </Suspense>
      )}
    </div>
  );
};

export default App;
