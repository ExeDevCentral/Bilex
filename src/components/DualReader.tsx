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
  Globe2
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
  const [fontSize, setFontSize] = useState<number>(15); // base font size in px

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
        <mark key={i}>{part}</mark>
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
    <div className="reader-workspace animate-fade-in">
      {/* Sticky Reader Toolbar */}
      <div className="reader-toolbar">
        <div className="doc-info-meta">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileText size={16} color="var(--accent-primary)" />
            <strong style={{ color: 'var(--text-main)' }}>{metadata.fileName}</strong>
            <span>({formatFileSize(metadata.fileSize)})</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Layers size={15} />
            <span>
              {metadata.totalPages} {metadata.totalPages === 1 ? 'página' : 'páginas'} • {pairs.length} párrafos
            </span>
          </div>

          {metadata.detectedLang && (
            <span className="badge badge-primary" title={`Detectado por franc: ${metadata.detectedLang.name}`}>
              <Globe2 size={11} /> {metadata.detectedLang.flag} Detectado: {metadata.detectedLang.name}
            </span>
          )}

          {metadata.isScanned && (
            <span className="badge badge-info" title="Texto procesado mediante OCR">
              <Sparkles size={11} /> OCR ({metadata.avgConfidence || 85}% conf.)
            </span>
          )}
        </div>

        {/* Search & Zoom Controls */}
        <div className="toolbar-controls">
          <div className="search-input-box">
            <Search size={14} color="var(--text-dim)" />
            <input
              type="text"
              placeholder="Buscar en texto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                {totalMatches}
              </span>
            )}
          </div>

          <div className="font-size-controls">
            <button
              className="btn btn-ghost btn-icon"
              style={{ width: 28, height: 28 }}
              onClick={() => setFontSize((f) => Math.max(12, f - 1))}
              title="Reducir tamaño de letra"
            >
              <ZoomOut size={14} />
            </button>
            <span style={{ fontSize: '0.75rem', padding: '0 4px', color: 'var(--text-muted)' }}>
              {fontSize}px
            </span>
            <button
              className="btn btn-ghost btn-icon"
              style={{ width: 28, height: 28 }}
              onClick={() => setFontSize((f) => Math.min(22, f + 1))}
              title="Aumentar tamaño de letra"
            >
              <ZoomIn size={14} />
            </button>
          </div>

          <button
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            onClick={() => handleCopyText(pairs.map((p) => p.translated).join('\n\n'), 'all-translated')}
            title="Copiar toda la traducción al portapapeles"
          >
            {copiedId === 'all-translated' ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
            <span>{copiedId === 'all-translated' ? '¡Copiado!' : 'Copiar todo'}</span>
          </button>
        </div>
      </div>

      {/* Dual Column Headings */}
      <div className="dual-header-grid">
        <div className="dual-header-col">
          <span>ORIGINAL ({sourceLang})</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-dim)' }}>
            Columna izquierda
          </span>
        </div>
        <div className="dual-header-col">
          <span>TRADUCCIÓN ({targetLang})</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-dim)' }}>
            Columna derecha (Editable)
          </span>
        </div>
      </div>

      {/* Synchronized Paragraph List */}
      <div className="paragraphs-container">
        {pairs.map((pair, index) => {
          const isFirstOfPage = index === 0 || pairs[index - 1].pageNumber !== pair.pageNumber;
          const isActive = activePairId === pair.id;
          const isEditing = editingPairId === pair.id;

          return (
            <React.Fragment key={pair.id}>
              {/* Page Number Divider if crossing pages */}
              {isFirstOfPage && metadata.totalPages > 1 && (
                <div className="page-divider-badge">
                  <span className="page-divider-text">Página {pair.pageNumber}</span>
                </div>
              )}

              <div
                ref={(el) => { pairRefs.current[pair.id] = el; }}
                className={`pair-row ${isActive ? 'is-active-pair' : ''}`}
                onClick={() => handleSelectPair(pair.id)}
              >
                {/* LEFT: Original Paragraph Card */}
                <div className="paragraph-card">
                  <div className="paragraph-card-header">
                    <span className="paragraph-number-badge">#{index + 1}</span>
                    <div className="card-actions-hover">
                      <button
                        className="btn btn-ghost btn-icon"
                        style={{ width: 26, height: 26 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyText(pair.original, `orig-${pair.id}`);
                        }}
                        title="Copiar párrafo original"
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
                <div className="paragraph-card">
                  <div className="paragraph-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="paragraph-number-badge">#{index + 1}</span>
                      {pair.isEdited && (
                        <span className="badge badge-info" style={{ fontSize: '9px', padding: '1px 5px' }}>
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
                          className="btn btn-ghost btn-icon"
                          style={{ width: 26, height: 26 }}
                          onClick={(e) => handleStartEdit(pair, e)}
                          title="Editar traducción a mano"
                        >
                          <Edit3 size={13} />
                        </button>
                      )}

                      {pair.status === 'error' && onRetranslateParagraph && (
                        <button
                          className="btn btn-ghost btn-icon"
                          style={{ width: 26, height: 26 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onRetranslateParagraph(pair.id);
                          }}
                          title="Reintentar traducción de este párrafo"
                        >
                          <RefreshCw size={13} color="var(--warning)" />
                        </button>
                      )}

                      <button
                        className="btn btn-ghost btn-icon"
                        style={{ width: 26, height: 26 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyText(pair.translated, `trans-${pair.id}`);
                        }}
                        title="Copiar traducción"
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
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                          onClick={handleCancelEdit}
                        >
                          <X size={13} /> Cancelar
                        </button>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                          onClick={(e) => handleSaveEdit(pair.id, e)}
                        >
                          <Save size={13} /> Guardar
                        </button>
                      </div>
                    </div>
                  ) : pair.status === 'translating' ? (
                    <div>
                      <div className="skeleton-line" style={{ width: '90%' }} />
                      <div className="skeleton-line" style={{ width: '75%' }} />
                      <div className="skeleton-line" style={{ width: '60%' }} />
                    </div>
                  ) : (
                    <div className="paragraph-text" style={{ fontSize: `${fontSize}px` }}>
                      {pair.translated ? (
                        renderHighlightedText(pair.translated)
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>
                          Traducción pendiente...
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
