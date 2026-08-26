import React, { useRef, useState } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Image as ImageIcon, 
  Sparkles, 
  FileCode, 
  Sliders, 
  ArrowLeft, 
  ArrowRight, 
  Trash2, 
  Plus, 
  Download, 
  Layers 
} from 'lucide-react';
import { OCR_LANGUAGES } from '../constants/languages';
import { compileImagesToPDF, downloadBlob } from '../services/imageToPdfService';

interface DropzoneUploadProps {
  onFileSelect: (file: File, options: { forceOcr: boolean; ocrLanguage: string; compiledPdfBlob?: Blob }) => void;
  onLoadSample: () => void;
  onLoadProjectJson: (file: File) => void;
  isProcessing: boolean;
}

interface StagedImage {
  id: string;
  file: File;
  previewUrl: string;
}

export const DropzoneUpload: React.FC<DropzoneUploadProps> = ({
  onFileSelect,
  onLoadSample,
  onLoadProjectJson,
  isProcessing,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [forceOcr, setForceOcr] = useState(false);
  const [ocrLanguage, setOcrLanguage] = useState('eng+spa');
  const [stagedImages, setStagedImages] = useState<StagedImage[]>([]);
  const [isCompilingPdf, setIsCompilingPdf] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const additionalImagesInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleAdditionalImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addImagesToStaging(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    const jsonFile = files.find((f) => f.name.endsWith('.json'));
    if (jsonFile) {
      onLoadProjectJson(jsonFile);
      return;
    }

    const pdfFile = files.find((f) => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    const imageFiles = files.filter(
      (f) => f.type.startsWith('image/') || /\.(png|jpe?g|webp|bmp)$/i.test(f.name)
    );

    // If a PDF is uploaded (and no images staged), process PDF directly
    if (pdfFile && imageFiles.length === 0) {
      onFileSelect(pdfFile, { forceOcr, ocrLanguage });
      return;
    }

    // If multiple images or single image dropped, add to staging
    if (imageFiles.length > 0) {
      addImagesToStaging(imageFiles);
    }
  };

  const addImagesToStaging = (files: File[]) => {
    const newStaged: StagedImage[] = files.map((file, idx) => ({
      id: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setStagedImages((prev) => [...prev, ...newStaged]);
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= stagedImages.length) return;

    const updated = [...stagedImages];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setStagedImages(updated);
  };

  const removeImage = (index: number) => {
    const item = stagedImages[index];
    URL.revokeObjectURL(item.previewUrl);
    setStagedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProcessStagedImages = async () => {
    if (stagedImages.length === 0) return;
    setIsCompilingPdf(true);

    try {
      const files = stagedImages.map((s) => s.file);
      const title = files.length === 1 ? files[0].name.replace(/\.[^/.]+$/, '.pdf') : `documento_fotos_${files.length}pag.pdf`;
      const { pdfFile, pdfBlob } = await compileImagesToPDF(files, title);

      // Force OCR for compiled image PDF
      onFileSelect(pdfFile, { forceOcr: true, ocrLanguage, compiledPdfBlob: pdfBlob });
    } catch (err: any) {
      alert(`Error al compilar las imágenes en PDF: ${err.message}`);
    } finally {
      setIsCompilingPdf(false);
    }
  };

  const handleDownloadOnlyCompiledPdf = async () => {
    if (stagedImages.length === 0) return;
    try {
      const files = stagedImages.map((s) => s.file);
      const title = `documento_fotos_sin_traducir_${files.length}pag.pdf`;
      const { pdfBlob } = await compileImagesToPDF(files, title);
      downloadBlob(pdfBlob, title);
    } catch (err: any) {
      alert(`Error al generar el PDF: ${err.message}`);
    }
  };

  return (
    <div className="upload-container animate-fade-in">
      {/* Dropzone Area */}
      <div
        className={`dropzone ${isDragOver ? 'is-dragover' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept=".pdf,image/png,image/jpeg,image/jpg,image/webp,application/pdf,.json"
          multiple
          style={{ display: 'none' }}
        />

        <div className="dropzone-icon-wrap">
          <UploadCloud size={38} />
        </div>

        <h2 className="dropzone-title">
          Arrastrá tu <span className="gradient-text">PDF o una/varias fotos</span> aquí
        </h2>
        <p className="dropzone-desc">
          Si subís varias fotos, las compilamos automáticamente en un único PDF ordenado con OCR.
        </p>

        <div className="dropzone-pills">
          <span className="dropzone-pill">
            <FileText size={12} style={{ display: 'inline', marginRight: 4 }} />
            PDF (Digital y Escaneado)
          </span>
          <span className="dropzone-pill">
            <ImageIcon size={12} style={{ display: 'inline', marginRight: 4 }} />
            Múltiples Fotos (JPG / PNG / WebP)
          </span>
          <span className="dropzone-pill">
            <Layers size={12} style={{ display: 'inline', marginRight: 4 }} />
            Reordenador de páginas
          </span>
          <span className="dropzone-pill">
            <Sparkles size={12} style={{ display: 'inline', marginRight: 4 }} />
            OCR WebAssembly en el Browser
          </span>
        </div>
      </div>

      {/* Multi-Image Staging Gallery if photos were uploaded */}
      {stagedImages.length > 0 && (
        <div
          className="glass-panel animate-fade-in"
          style={{
            marginTop: 24,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Layers size={18} color="var(--accent-primary)" />
                Fotos cargadas ({stagedImages.length} {stagedImages.length === 1 ? 'página' : 'páginas'})
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Podés reordenar las fotos antes de generar el PDF y traducir.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                onClick={() => additionalImagesInputRef.current?.click()}
              >
                <Plus size={14} />
                <span>Agregar fotos</span>
              </button>
              <input
                type="file"
                ref={additionalImagesInputRef}
                onChange={handleAdditionalImagesChange}
                accept="image/png,image/jpeg,image/jpg,image/webp"
                multiple
                style={{ display: 'none' }}
              />

              <button
                type="button"
                className="btn btn-ghost"
                style={{ padding: '6px 10px', fontSize: '0.8rem', color: 'var(--danger)' }}
                onClick={() => {
                  stagedImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
                  setStagedImages([]);
                }}
              >
                <Trash2 size={14} />
                <span>Limpiar</span>
              </button>
            </div>
          </div>

          {/* Grid of staged image thumbnails */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: 12,
              maxHeight: 320,
              overflowY: 'auto',
              padding: 4,
            }}
          >
            {stagedImages.map((item, idx) => (
              <div
                key={item.id}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  position: 'relative',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: 6,
                    left: 6,
                    background: 'rgba(0,0,0,0.7)',
                    color: '#fff',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '10px',
                    fontWeight: 'bold',
                  }}
                >
                  Pág {idx + 1}
                </span>

                <img
                  src={item.previewUrl}
                  alt={`Página ${idx + 1}`}
                  style={{
                    width: '100%',
                    height: 110,
                    objectFit: 'cover',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: 6,
                  }}
                />

                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '100%',
                    textAlign: 'center',
                    marginBottom: 6,
                  }}
                  title={item.file.name}
                >
                  {item.file.name}
                </span>

                {/* Move & Delete controls */}
                <div style={{ display: 'flex', gap: 4, width: '100%', justifyContent: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon"
                    style={{ width: 24, height: 24, padding: 0 }}
                    onClick={() => moveImage(idx, 'left')}
                    disabled={idx === 0}
                    title="Mover foto a la izquierda"
                  >
                    <ArrowLeft size={12} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon"
                    style={{ width: 24, height: 24, padding: 0, color: 'var(--danger)' }}
                    onClick={() => removeImage(idx)}
                    title="Eliminar esta foto"
                  >
                    <Trash2 size={12} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon"
                    style={{ width: 24, height: 24, padding: 0 }}
                    onClick={() => moveImage(idx, 'right')}
                    disabled={idx === stagedImages.length - 1}
                    title="Mover foto a la derecha"
                  >
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Action buttons for Staged Images */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              flexWrap: 'wrap',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: 12,
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleDownloadOnlyCompiledPdf}
              disabled={isCompilingPdf || isProcessing}
              title="Descarga el PDF con las fotos ordenadas sin necesidad de traducir"
            >
              <Download size={15} />
              <span>Descargar solo PDF de fotos (sin traducir)</span>
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleProcessStagedImages}
              disabled={isCompilingPdf || isProcessing}
            >
              <Sparkles size={15} />
              <span>{isCompilingPdf ? 'Compilando...' : `Compilar PDF y Traducir (${stagedImages.length} págs)`}</span>
            </button>
          </div>
        </div>
      )}

      {/* Extraction Options Bar */}
      <div className="upload-options-card">
        <div className="option-item">
          <Sliders size={16} color="var(--accent-primary)" />
          <label className="form-label" style={{ marginBottom: 0 }}>
            Idioma de OCR:
          </label>
          <select
            className="option-select"
            value={ocrLanguage}
            onChange={(e) => setOcrLanguage(e.target.value)}
            disabled={isProcessing}
          >
            {OCR_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.tesseractCode}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        <div className="option-item">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={forceOcr}
              onChange={(e) => setForceOcr(e.target.checked)}
              disabled={isProcessing}
            />
            <span>Forzar OCR en todas las páginas</span>
          </label>
        </div>
      </div>

      {/* Quick Test and JSON session action */}
      <div className="sample-section">
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          ¿No tenés un archivo a mano? Probá con un documento de ejemplo o abrí un proyecto guardado:
        </p>
        <div className="sample-buttons-row">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onLoadSample}
            disabled={isProcessing}
          >
            <Sparkles size={15} color="#a855f7" />
            <span>Cargar documento de prueba</span>
          </button>

          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => jsonInputRef.current?.click()}
            disabled={isProcessing}
          >
            <FileCode size={15} />
            <span>Cargar sesión JSON</span>
          </button>
          <input
            type="file"
            ref={jsonInputRef}
            onChange={(e) => e.target.files?.[0] && onLoadProjectJson(e.target.files[0])}
            accept=".json"
            style={{ display: 'none' }}
          />
        </div>
      </div>
    </div>
  );
};
