import React, { useState } from 'react';
import { 
  X, 
  Download, 
  FileText, 
  FileCode, 
  Check, 
  Layers, 
  Sparkles, 
  Image as ImageIcon 
} from 'lucide-react';
import type { ParagraphPair, DocumentMetadata } from '../types';
import { 
  exportBilingualPDF, 
  exportPlainText, 
  exportMarkdown, 
  exportProjectJSON 
} from '../services/exportService';
import { downloadBlob } from '../services/imageToPdfService';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  pairs: ParagraphPair[];
  metadata: DocumentMetadata;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  pairs,
  metadata,
}) => {
  const [exportType, setExportType] = useState<
    'pdf-bilingual' | 'pdf-untranslated' | 'txt-translated' | 'txt-interleaved' | 'markdown' | 'json'
  >('pdf-bilingual');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    switch (exportType) {
      case 'pdf-bilingual':
        exportBilingualPDF(pairs, metadata);
        break;
      case 'pdf-untranslated':
        if (metadata.compiledPdfBlob) {
          const base = metadata.fileName.replace(/\.[^/.]+$/, '');
          downloadBlob(metadata.compiledPdfBlob, `${base}_original_fotos.pdf`);
        }
        break;
      case 'txt-translated':
        exportPlainText(pairs, metadata, 'translated-only');
        break;
      case 'txt-interleaved':
        exportPlainText(pairs, metadata, 'interleaved');
        break;
      case 'markdown':
        exportMarkdown(pairs, metadata);
        break;
      case 'json':
        exportProjectJSON(pairs, metadata);
        break;
    }

    setDownloadSuccess(true);
    setTimeout(() => {
      setDownloadSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Download size={20} color="var(--accent-primary)" />
            <h3>Exportar Documento</h3>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Elegí el formato en el que querés descargar tu traducción y documento bilingüe:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Option 1: PDF Bilingue */}
            <label
              className={`provider-card ${exportType === 'pdf-bilingual' ? 'is-selected' : ''}`}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}
            >
              <input
                type="radio"
                name="exportType"
                checked={exportType === 'pdf-bilingual'}
                onChange={() => setExportType('pdf-bilingual')}
                style={{ marginTop: 3 }}
              />
              <div>
                <strong style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileText size={15} color="var(--accent-primary)" />
                  PDF Bilingüe a 2 Columnas (Recomendado)
                </strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Documento PDF listo para imprimir o leer, con el texto original a la izquierda y la traducción a la derecha alineados por párrafo.
                </span>
              </div>
            </label>

            {/* Option 1b: PDF de Fotos Original (sin traducir) if available */}
            {metadata.compiledPdfBlob && (
              <label
                className={`provider-card ${exportType === 'pdf-untranslated' ? 'is-selected' : ''}`}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}
              >
                <input
                  type="radio"
                  name="exportType"
                  checked={exportType === 'pdf-untranslated'}
                  onChange={() => setExportType('pdf-untranslated')}
                  style={{ marginTop: 3 }}
                />
                <div>
                  <strong style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ImageIcon size={15} color="var(--info)" />
                    PDF de Fotos Original (Sin Traducir)
                  </strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Descarga el archivo PDF unificado compilado a partir de las fotos subidas en su orden.
                  </span>
                </div>
              </label>
            )}

            {/* Option 2: TXT Solo Traducción */}
            <label
              className={`provider-card ${exportType === 'txt-translated' ? 'is-selected' : ''}`}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}
            >
              <input
                type="radio"
                name="exportType"
                checked={exportType === 'txt-translated'}
                onChange={() => setExportType('txt-translated')}
                style={{ marginTop: 3 }}
              />
              <div>
                <strong style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileText size={15} />
                  Texto Plano (.txt) — Solo Traducción
                </strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Documento limpio con todo el texto traducido continuo.
                </span>
              </div>
            </label>

            {/* Option 3: TXT Intercalado */}
            <label
              className={`provider-card ${exportType === 'txt-interleaved' ? 'is-selected' : ''}`}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}
            >
              <input
                type="radio"
                name="exportType"
                checked={exportType === 'txt-interleaved'}
                onChange={() => setExportType('txt-interleaved')}
                style={{ marginTop: 3 }}
              />
              <div>
                <strong style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Layers size={15} />
                  Texto Plano (.txt) — Intercalado Bilingüe
                </strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Cada párrafo original seguido inmediatamente por su traducción correspondiente.
                </span>
              </div>
            </label>

            {/* Option 4: Markdown */}
            <label
              className={`provider-card ${exportType === 'markdown' ? 'is-selected' : ''}`}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}
            >
              <input
                type="radio"
                name="exportType"
                checked={exportType === 'markdown'}
                onChange={() => setExportType('markdown')}
                style={{ marginTop: 3 }}
              />
              <div>
                <strong style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileCode size={15} />
                  Markdown Bilingüe (.md)
                </strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Tabla comparativa en formato Markdown para Obsidian, Notion o GitHub.
                </span>
              </div>
            </label>

            {/* Option 5: JSON Project */}
            <label
              className={`provider-card ${exportType === 'json' ? 'is-selected' : ''}`}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}
            >
              <input
                type="radio"
                name="exportType"
                checked={exportType === 'json'}
                onChange={() => setExportType('json')}
                style={{ marginTop: 3 }}
              />
              <div>
                <strong style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={15} color="#a855f7" />
                  Guardar Sesión de Proyecto (.json)
                </strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Exporta el estado completo para poder abrirlo y seguir editando sin volver a traducir.
                </span>
              </div>
            </label>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleExport}
            disabled={downloadSuccess}
          >
            {downloadSuccess ? <Check size={16} /> : <Download size={16} />}
            <span>{downloadSuccess ? '¡Descargado!' : 'Descargar Archivo'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
