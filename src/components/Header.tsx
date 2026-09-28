import React from 'react';
import { 
  BookOpen, 
  Settings, 
  Download, 
  Sun, 
  Moon, 
  ArrowLeftRight, 
  FilePlus2,
  Feather
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../constants/languages';
import type { TranslationConfig } from '../types';

interface HeaderProps {
  config: TranslationConfig;
  onConfigChange: (newConfig: TranslationConfig) => void;
  onOpenSettings: () => void;
  onOpenExport: () => void;
  onNewDocument: () => void;
  hasDocument: boolean;
  isProcessing: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  onConfigChange,
  onOpenSettings,
  onOpenExport,
  onNewDocument,
  hasDocument,
  isProcessing,
  theme,
  onToggleTheme,
}) => {
  const handleSwapLanguages = () => {
    if (config.sourceLang === 'AUTO') return;
    onConfigChange({
      ...config,
      sourceLang: config.targetLang,
      targetLang: config.sourceLang,
    });
  };

  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-logo-icon" title="Códice Bilex">
          <BookOpen size={20} className="brand-icon-primary" />
          <Feather size={12} className="brand-icon-quill" />
        </div>
        <div className="brand-text-container">
          <h1 className="brand-title">
            BI<span className="brand-title-accent">LEX</span>
          </h1>
          <p className="brand-subtitle">Traductor Bilingüe &amp; Lector de Códices</p>
        </div>
      </div>

      {/* Language Selector in Header */}
      <div className="lang-selector-group" role="group" aria-label="Selección de Idiomas">
        <select
          className="lang-select"
          value={config.sourceLang}
          onChange={(e) => onConfigChange({ ...config, sourceLang: e.target.value })}
          disabled={isProcessing}
          title="Idioma del texto original"
          aria-label="Idioma de origen"
        >
          <option value="AUTO">✨ Auto-detectar</option>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.flag} {lang.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="lang-swap-btn"
          onClick={handleSwapLanguages}
          disabled={isProcessing || config.sourceLang === 'AUTO'}
          title="Intercambiar idiomas de traducción"
          aria-label="Intercambiar idiomas"
        >
          <ArrowLeftRight size={14} />
        </button>

        <select
          className="lang-select"
          value={config.targetLang}
          onChange={(e) => onConfigChange({ ...config, targetLang: e.target.value })}
          disabled={isProcessing}
          title="Idioma de la traducción"
          aria-label="Idioma destino"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.flag} {lang.name}
            </option>
          ))}
        </select>
      </div>

      {/* Action Buttons */}
      <div className="header-actions">
        {hasDocument && (
          <>
            <button
              type="button"
              className="btn btn-secondary header-action-btn"
              onClick={onNewDocument}
              disabled={isProcessing}
              title="Cargar otro documento o tomo"
            >
              <FilePlus2 size={16} />
              <span className="btn-label-responsive">Nuevo</span>
            </button>

            <button
              type="button"
              className="btn btn-primary header-action-btn"
              onClick={onOpenExport}
              disabled={isProcessing}
              title="Exportar traducción a compendio PDF bilingüe"
            >
              <Download size={16} />
              <span className="btn-label-responsive">Exportar</span>
            </button>
          </>
        )}

        <button
          type="button"
          className="btn btn-secondary btn-icon theme-toggle-btn"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Cambiar a Pergamino Real (Modo Día)' : 'Cambiar a Cuarto de Medianoche (Modo Noche)'}
          aria-label={theme === 'dark' ? 'Activar modo pergamino claro' : 'Activar modo cuarto nocturno'}
        >
          {theme === 'dark' ? <Sun size={17} className="icon-sun" /> : <Moon size={17} className="icon-moon" />}
        </button>

        <button
          type="button"
          className="btn btn-secondary btn-icon"
          onClick={onOpenSettings}
          title="Configuración de Motores de Traducción"
          aria-label="Abrir configuración"
        >
          <Settings size={17} />
        </button>
      </div>
    </header>
  );
};
