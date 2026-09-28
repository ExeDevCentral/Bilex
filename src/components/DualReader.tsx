import React, { useState, useRef } from 'react';
import { 
  Copy, 
  Check, 
  Edit3, 
  Save, 
  X, 
  Search, 
  ZoomIn, 
  ZoomOut, 
  FileText, 
  Layers, 
  Sparkles, 
  RefreshCw,
  Globe2,
  Type
} from 'lucide-react';
import type { ParagraphPair, DocumentMetadata } from '../types';

interface DualReaderProps {
  pairs: ParagraphPair[];
  metadata: DocumentMetadata;
  sourceLang: string;
  targetLang: string;
  onUpdateParagraph: (id: string, newTranslation: string) => void;
  onRetranslateParagraph?: (id: string) => void;
}

const toRomanNumeral = (num: number): string => {
  const romanMap: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];
  let res = '';
  let n = num;
  for (const [val, sym] of romanMap) {
    while (n >= val) {
      res += sym;
      n -= val;
    }
  }
  return res || 'I';
};

export const DualReader: React.FC<DualReaderProps> = ({
  pairs,
  metadata,
  sourceLang,
  targetLang,
  onUpdateParagraph,
  onRetranslateParagraph,
}) => {
  const [activePairId, setActivePairId] = useState<string | null>(null);
  const [editingPairId, setEditingPairId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [fontSize, setFontSize] = useState<number>(17); // base font size in px
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans'>('serif');
  const [mobileView, setMobileView] = useState<'original' | 'translated' | 'interleaved'>('interleaved');

  const pairRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Handle clicking a paragraph: set active and scroll into view smoothly
  const handleSelectPair = (id: string) => {
    setActivePairId(id);
    const elem = pairRefs.current[id];
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // Copy text to clipboard
  const handleCopyText = async (text: string, identifier: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(identifier);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  // Start inline editing
  const handleStartEdit = (pair: ParagraphPair, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPairId(pair.id);
    setEditContent(pair.translated);
  };

  // Save inline editing
  const handleSaveEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateParagraph(id, editContent);
    setEditingPairId(null);
  };

  // Cancel inline editing
  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPairId(null);
    setEditContent('');
  };

  // Helper to render text with search matches highlighted
  const renderHighlightedText = (text: string) => {
    if (!searchQuery.trim() || !text) return text;

    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="search-highlight">{part}</mark>
      ) : (
        part
      )
    );
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Count search occurrences
  const totalMatches = searchQuery.trim()
    ? pairs.reduce((acc, p) => {
        const origMatches = (p.original.match(new RegExp(searchQuery, 'gi')) || []).length;
        const transMatches = ((p.translated || '').match(new RegExp(searchQuery, 'gi')) || []).length;
        return acc + origMatches + transMatches;
      }, 0)
    : 0;

  return (
    <div className={`reader-workspace animate-fade-in font-family-${fontFamily}`}>
      {/* Sticky Reader Toolbar */}
      <div className="reader-toolbar">
        <div className="doc-info-meta">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileText size={16} color="var(--border-gold)" />
            <strong style={{ color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>{metadata.fileName}</strong>
            <span style={{ color: 'var(--text-dim)' }}>({formatFileSize(metadata.fileSize)})</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Layers size={15} />
            <span>
              {metadata.totalPages} {metadata.totalPages === 1 ? 'folio' : 'folios'} • {pairs.length} estrofas
            </span>
          </div>

          {metadata.detectedLang && (
            <span className="badge badge-primary" title={`Detectado por franc: ${metadata.detectedLang.name}`}>
              <Globe2 size={11} /> {metadata.detectedLang.flag} {metadata.detectedLang.name}
            </span>
          )}

          {metadata.isScanned && (
            <span className="badge badge-info" title="Texto procesado mediante OCR de escriba">
              <Sparkles size={11} /> OCR ({metadata.avgConfidence || 85}%)
            </span>
          )}
        </div>

        {/* Search, Typography & Zoom Controls */}
        <div className="toolbar-controls">
          <div className="search-input-box">
            <Search size={14} color="var(--text-dim)" />
            <input
              type="text"
              placeholder="Buscar en el códice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Buscar en el texto"
            />
            {searchQuery && (
              <span style={{ fontSize: '0.75rem', color: 'var(--border-gold)', fontWeight: 700 }}>
                {totalMatches}
              </span>
            )}
          </div>

          {/* Typography Serif / Sans switch */}
          <button
            type="button"
            className="btn btn-secondary btn-icon"
            style={{ width: 32, height: 32 }}
            onClick={() => setFontFamily((prev) => prev === 'serif' ? 'sans' : 'serif')}
            title={fontFamily === 'serif' ? 'Cambiar a tipografía moderna (Sans)' : 'Cambiar a tipografía clásica (Garamond Serif)'}
            aria-label="Cambiar estilo tipográfico"
          >
            <Type size={15} />
          </button>

          <div className="font-size-controls" role="group" aria-label="Control de tamaño de fuente">
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              style={{ width: 28, height: 28 }}
              onClick={() => setFontSize((f) => Math.max(13, f - 1))}
              title="Reducir tamaño de letra"
              aria-label="Reducir tamaño de letra"
            >
              <ZoomOut size={14} />
            </button>
            <span style={{ fontSize: '0.78rem', padding: '0 4px', color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
              {fontSize}px
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              style={{ width: 28, height: 28 }}
              onClick={() => setFontSize((f) => Math.min(24, f + 1))}
              title="Aumentar tamaño de letra"
              aria-label="Aumentar tamaño de letra"
            >
              <ZoomIn size={14} />
            </button>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
            onClick={() => handleCopyText(pairs.map((p) => p.translated).join('\n\n'), 'all-translated')}
            title="Copiar compendio traducido completo"
          >
            {copiedId === 'all-translated' ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
            <span>{copiedId === 'all-translated' ? '¡Copiado!' : 'Copiar todo'}</span>
          </button>
        </div>
      </div>

      {/* Mobile View Segmented Switch for Small Screens */}
      <div className="mobile-view-tabs" role="tablist" aria-label="Selector de Vista para Móvil">
        <button
          type="button"
          role="tab"
          aria-selected={mobileView === 'original'}
          className={`mobile-tab-btn ${mobileView === 'original' ? 'is-active' : ''}`}
          onClick={() => setMobileView('original')}
        >
          Acto I (Original)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobileView === 'translated'}
          className={`mobile-tab-btn ${mobileView === 'translated' ? 'is-active' : ''}`}
          onClick={() => setMobileView('translated')}
        >
          Acto II (Traducción)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobileView === 'interleaved'}
          className={`mobile-tab-btn ${mobileView === 'interleaved' ? 'is-active' : ''}`}
          onClick={() => setMobileView('interleaved')}
        >
          Bilingüe Intercalado
        </button>
      </div>

      {/* Dual Column Headings (Desktop) */}
      <div className="dual-header-grid">
        <div className="dual-header-col">
          <span className="dual-header-title">ACTO I · TEXTO ORIGINAL ({sourceLang})</span>
          <span className="dual-header-sub">Folio izquierdo</span>
        </div>
        <div className="dual-header-col">
          <span className="dual-header-title">ACTO II · TRADUCCIÓN ({targetLang})</span>
          <span className="dual-header-sub">Folio derecho (Editable)</span>
        </div>
      </div>

      {/* Synchronized Paragraph List */}
      <div className={`paragraphs-container mobile-mode-${mobileView}`}>
        {pairs.map((pair, index) => {
          const isFirstOfPage = index === 0 || pairs[index - 1].pageNumber !== pair.pageNumber;
          const isActive = activePairId === pair.id;
          const isEditing = editingPairId === pair.id;
          const romanPage = toRomanNumeral(pair.pageNumber);

          return (
            <React.Fragment key={pair.id}>
              {/* Page Number Divider if crossing pages */}
              {isFirstOfPage && (
                <div className="page-divider-badge">
                  <span className="page-divider-fleuron">❧</span>
                  <span className="page-divider-text">
                    Folio {romanPage} · Página {pair.pageNumber} {metadata.totalPages > 1 ? `de ${metadata.totalPages}` : ''}
                  </span>
                  <span className="page-divider-fleuron">❧</span>
                </div>
              )}

              <div
                ref={(el) => { pairRefs.current[pair.id] = el; }}
                className={`pair-row ${isActive ? 'is-active-pair' : ''} pair-row--${mobileView}`}
                onClick={() => handleSelectPair(pair.id)}
              >
                {/* LEFT: Original Paragraph Card */}
                <div className="paragraph-card paragraph-card--source">
                  <div className="paragraph-card-header">
                    <span className="paragraph-number-badge" title="Número de estrofa">
                      § {index + 1}
                    </span>
                    <span className="paragraph-act-tag">Original</span>
                    <div className="card-actions-hover">
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon"
                        style={{ width: 26, height: 26 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyText(pair.original, `orig-${pair.id}`);
                        }}
                        title="Copiar párrafo original"
                        aria-label="Copiar texto original"
                      >
                        {copiedId === `orig-${pair.id}` ? (
                          <Check size={13} color="var(--success)" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="paragraph-text" style={{ fontSize: `${fontSize}px` }}>
                    {renderHighlightedText(pair.original)}
                  </div>
                </div>

                {/* RIGHT: Translated Paragraph Card */}
                <div className="paragraph-card paragraph-card--target">
                  <div className="paragraph-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="paragraph-number-badge" title="Número de estrofa">
                        § {index + 1}
                      </span>
                      <span className="paragraph-act-tag paragraph-act-tag--trans">Traducción</span>
                      {pair.isEdited && (
                        <span className="badge badge-primary" style={{ fontSize: '9px', padding: '1px 5px' }}>
                          Editado
                        </span>
                      )}
                      {pair.status === 'error' && (
                        <span className="badge badge-warning" style={{ fontSize: '9px', padding: '1px 5px' }}>
                          Error
                        </span>
                      )}
                    </div>

                    <div className="card-actions-hover">
                      {!isEditing && pair.status === 'done' && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon"
                          style={{ width: 26, height: 26 }}
                          onClick={(e) => handleStartEdit(pair, e)}
                          title="Editar traducción a mano"
                          aria-label="Editar traducción"
                        >
                          <Edit3 size={13} />
                        </button>
                      )}

                      {pair.status === 'error' && onRetranslateParagraph && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon"
                          style={{ width: 26, height: 26 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onRetranslateParagraph(pair.id);
                          }}
                          title="Reintentar traducción de esta estrofa"
                          aria-label="Reintentar traducción"
                        >
                          <RefreshCw size={13} color="var(--warning)" />
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn btn-ghost btn-icon"
                        style={{ width: 26, height: 26 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyText(pair.translated, `trans-${pair.id}`);
                        }}
                        title="Copiar traducción"
                        aria-label="Copiar traducción"
                      >
                        {copiedId === `trans-${pair.id}` ? (
                          <Check size={13} color="var(--success)" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Body: Editing Mode, Skeleton, or Translated Text */}
                  {isEditing ? (
                    <div onClick={(e) => e.stopPropagation()}>
                      <textarea
                        className="edit-textarea"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        style={{ fontSize: `${fontSize}px` }}
                        autoFocus
                      />
                      <div className="edit-actions-row">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                          onClick={handleCancelEdit}
                        >
                          <X size={13} /> Cancelar
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                          onClick={(e) => handleSaveEdit(pair.id, e)}
                        >
                          <Save size={13} /> Guardar
                        </button>
                      </div>
                    </div>
                  ) : pair.status === 'translating' ? (
                    <div>
                      <div className="skeleton-line" style={{ width: '92%' }} />
                      <div className="skeleton-line" style={{ width: '78%' }} />
                      <div className="skeleton-line" style={{ width: '64%' }} />
                    </div>
                  ) : (
                    <div className="paragraph-text" style={{ fontSize: `${fontSize}px` }}>
                      {pair.translated ? (
                        renderHighlightedText(pair.translated)
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>
                          Traducción en curso por el escriba...
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default DualReader;
