import React from 'react';
import { 
  Loader2, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Sparkles, 
  Languages 
} from 'lucide-react';
import type { ProcessingState } from '../types';

interface ProcessingProgressProps {
  state: ProcessingState;
  onRetry?: () => void;
  onCancel?: () => void;
}

export const ProcessingProgress: React.FC<ProcessingProgressProps> = ({
  state,
  onRetry,
  onCancel,
}) => {
  const steps = [
    { key: 'loading-file', label: 'Cargar Archivo', icon: FileText },
    { key: 'extracting-pdf', label: 'Extraer Texto', icon: FileText },
    { key: 'running-ocr', label: 'OCR / Escaneo', icon: Sparkles },
    { key: 'translating', label: 'Traducción', icon: Languages },
  ];

  const getStepStatus = (stepKey: string) => {
    const order = ['loading-file', 'extracting-pdf', 'rendering-canvas', 'running-ocr', 'segmenting', 'translating', 'ready'];
    const currentIdx = order.indexOf(state.stage);
    const stepIdx = order.indexOf(stepKey);

    if (state.stage === 'error') return 'error';
    if (state.stage === 'ready' || currentIdx > stepIdx) return 'is-done';
    if (currentIdx === stepIdx || (stepKey === 'extracting-pdf' && state.stage === 'rendering-canvas')) return 'is-active';
    return '';
  };

  return (
    <div className="progress-card animate-fade-in">
      <div className="progress-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {state.stage === 'error' ? (
            <XCircle size={24} color="var(--danger)" />
          ) : state.stage === 'ready' ? (
            <CheckCircle2 size={24} color="var(--success)" />
          ) : (
            <Loader2 size={24} className="animate-spin" color="var(--accent-primary)" />
          )}
          <h3 style={{ fontSize: '1.15rem' }}>
            {state.stage === 'error'
              ? 'Ocurrió un inconveniente'
              : state.stage === 'ready'
              ? '¡Procesamiento Completado!'
              : 'Procesando documento...'}
          </h3>
        </div>
        <span className="badge badge-primary">{Math.round(state.progress)}%</span>
      </div>

      {/* Main animated progress bar */}
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{
            width: `${Math.max(4, Math.min(100, state.progress))}%`,
            background: state.stage === 'error' ? 'var(--danger)' : undefined,
          }}
        />
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 12 }}>
        {state.statusMessage}
      </p>

      {state.details && (
        <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
          {state.details}
        </p>
      )}

      {/* Step Indicators */}
      <div className="progress-steps-list">
        {steps.map((s, idx) => {
          const statusClass = getStepStatus(s.key);
          const Icon = s.icon;
          return (
            <div key={s.key} className={`progress-step-item ${statusClass}`}>
              <div className="step-circle">
                {statusClass === 'is-done' ? (
                  <CheckCircle2 size={16} />
                ) : statusClass === 'is-active' ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  idx + 1
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon size={12} />
                <span>{s.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Low OCR Confidence Banner */}
      {state.lowConfidenceWarning && (
        <div className="confidence-warning animate-fade-in">
          <AlertTriangle size={20} style={{ flexShrink: 0 }} />
          <div>
            <strong>Aviso de calidad de imagen / OCR (Confianza: {state.avgConfidence}%):</strong>
            <p style={{ marginTop: 4, fontSize: '0.8rem', color: '#fde68a' }}>
              El texto reconocido podría contener pequeñas imprecisiones si la foto o escaneo está borroso o tiene poco contraste. Vas a poder revisar y editar cualquier párrafo en la vista dual.
            </p>
          </div>
        </div>
      )}

      {/* Error state and retry buttons */}
      {state.stage === 'error' && (
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 12 }}>
          {onRetry && (
            <button className="btn btn-primary" onClick={onRetry}>
              Reintentar
            </button>
          )}
          {onCancel && (
            <button className="btn btn-secondary" onClick={onCancel}>
              Cancelar y volver
            </button>
          )}
        </div>
      )}
    </div>
  );
};
