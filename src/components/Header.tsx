import React from 'react';
import { 
  BookOpen, 
  Settings, 
  Download, 
  Sun, 
  Moon, 
  ArrowLeftRight, 
  FilePlus2
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
        <div className="brand-logo-icon">
          <BookOpen size={22} />
        </div>
        <div>
          <h1 className="brand-title">
            Dual<span className="gradient-text">Doc</span>
          </h1>
          <p className="brand-subtitle">Lectura y Traducción Bilingüe</p>
        </div>
      </div>

      {/* Language Selector in Header */}
      <div className="lang-selector-group">
        <select
          className="lang-select"
          value={config.sourceLang}
          onChange={(e) => onConfigChange({ ...config, sourceLang: e.target.value })}
          disabled={isProcessing}
          title="Idioma de origen"
        >
          <option value="AUTO">✨ Auto-detectar</option>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.flag} {lang.name}
            </option>
          ))}
        </select>

        <button
          className="lang-swap-btn"
          onClick={handleSwapLanguages}
          disabled={isProcessing || config.sourceLang === 'AUTO'}
          title="Intercambiar idiomas"
        >
          <ArrowLeftRight size={14} />
        </button>

        <select
          className="lang-select"
          value={config.targetLang}
          onChange={(e) => onConfigChange({ ...config, targetLang: e.target.value })}
          disabled={isProcessing}
          title="Idioma destino"
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
              className="btn btn-secondary"
              onClick={onNewDocument}
              disabled={isProcessing}
              title="Cargar otro documento"
            >
              <FilePlus2 size={16} />
              <span>Nuevo</span>
            </button>

            <button
              className="btn btn-primary"
              onClick={onOpenExport}
              disabled={isProcessing}
              title="Exportar traducción y documento bilingüe"
            >
              <Download size={16} />
              <span>Exportar</span>
            </button>
          </>
        )}

        <button
          className="btn btn-secondary btn-icon"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          className="btn btn-secondary btn-icon"
          onClick={onOpenSettings}
          title="Configuración de APIs de Traducción"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
};
