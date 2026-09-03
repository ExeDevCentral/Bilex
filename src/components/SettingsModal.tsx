import React, { useState } from 'react';
import { 
  X, 
  Key, 
  Check, 
  AlertCircle, 
  Loader2, 
  ExternalLink, 
  Globe, 
  ShieldCheck, 
  Sliders,
  Sparkles
} from 'lucide-react';
import type { TranslationConfig, TranslationProvider } from '../types';
import { PROVIDER_INFO } from '../constants/languages';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: TranslationConfig;
  onSaveConfig: (config: TranslationConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [localConfig, setLocalConfig] = useState<TranslationConfig>({ ...config });
  const [testStatus, setTestStatus] = useState<{
    testing: boolean;
    success?: boolean;
    message?: string;
  }>({ testing: false });

  if (!isOpen) return null;

  const handleProviderSelect = (provider: TranslationProvider) => {
    setLocalConfig((prev) => ({
      ...prev,
      provider,
      apiKey: provider === 'mock' ? '' : prev.apiKey,
      model: provider === 'gemini' ? 'gemini-3.6-flash' : provider === 'groq' ? 'llama-3.3-70b-versatile' : prev.model,
    }));
  };

  const handleTestConnection = async () => {
    setTestStatus({ testing: true });

    try {
      if (localConfig.provider === 'mock') {
        await new Promise((r) => setTimeout(r, 400));
        setTestStatus({ testing: false, success: true, message: 'Modo Demo listo para funcionar sin API Keys.' });
        return;
      }

      if (!localConfig.apiKey && localConfig.provider !== 'libretranslate') {
        throw new Error('Ingresa una API Key antes de probar la conexión.');
      }

      // Perform a quick 1-phrase test translation
      let response: Response;

      if (localConfig.useServerless) {
        response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            texts: ['Hello world! Translation is ready.'],
            sourceLang: 'EN',
            targetLang: 'ES',
            provider: localConfig.provider,
            apiKey: localConfig.apiKey,
            model: localConfig.model,
            customApiUrl: localConfig.customApiUrl,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => null);
          throw new Error(errData?.error || `Error ${response.status} en endpoint serverless.`);
        }
      } else {
        // Direct client test
        if (localConfig.provider === 'gemini') {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${localConfig.model || 'gemini-3.6-flash'}:generateContent?key=${localConfig.apiKey}`;
          response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: 'Translate ["Hello world"] to Spanish as JSON array of strings' }] }],
              generationConfig: { responseMimeType: 'application/json' },
            }),
          });
          if (!response.ok) throw new Error('Error al conectar con Google Gemini API.');
        } else if (localConfig.provider === 'deepl') {
          const isFree = localConfig.apiKey?.endsWith(':fx');
          const endpoint = isFree
            ? 'https://api-free.deepl.com/v2/translate'
            : 'https://api.deepl.com/v2/translate';

          response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Authorization': `DeepL-Auth-Key ${localConfig.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: ['Hello world!'],
              target_lang: 'ES',
            }),
          });

          if (!response.ok) {
            const err = await response.text();
            throw new Error(`Error de DeepL: ${err}`);
          }
        }
      }

      setTestStatus({
        testing: false,
        success: true,
        message: '¡Conexión exitosa con la API de traducción!',
      });
    } catch (err: any) {
      setTestStatus({
        testing: false,
        success: false,
        message: err.message || 'Error de conexión con el proveedor.',
      });
    }
  };

  const handleSave = () => {
    onSaveConfig(localConfig);
    onClose();
  };

  const currentProviderInfo: any = PROVIDER_INFO[localConfig.provider];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sliders size={20} color="var(--accent-primary-light)" />
            <h3>Configuración de Traducción</h3>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Provider Selection Grid */}
          <div className="form-group">
            <label className="form-label">Elegí tu Proveedor de Traducción:</label>
            <div className="provider-grid">
              {(['gemini', 'groq', 'deepl', 'openai', 'claude', 'libretranslate', 'mock'] as TranslationProvider[]).map((prov) => (
                <button
                  key={prov}
                  type="button"
                  className={`provider-card ${localConfig.provider === prov ? 'is-selected' : ''}`}
                  onClick={() => handleProviderSelect(prov)}
                >
                  <strong className="provider-card-title">
                    {prov === 'gemini' && '✨ Google Gemini'}
                    {prov === 'groq' && '⚡ Groq (Llama 3.3)'}
                    {prov === 'deepl' && 'DeepL API'}
                    {prov === 'openai' && 'OpenAI (GPT)'}
                    {prov === 'claude' && 'Anthropic (Claude)'}
                    {prov === 'libretranslate' && 'LibreTranslate'}
                    {prov === 'mock' && 'Modo Demo (Mock)'}
                  </strong>
                  <span className="provider-card-desc">
                    {prov === 'gemini' && '100% Gratis sin tarjeta'}
                    {prov === 'groq' && '100% Gratis ultra-rápido'}
                    {prov === 'deepl' && '500k chars/mes'}
                    {prov === 'openai' && 'Pago por token'}
                    {prov === 'claude' && 'Pago por token'}
                    {prov === 'libretranslate' && 'Open Source'}
                    {prov === 'mock' && 'Offline Ilimitado'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Provider Info Banner */}
          <div className="provider-info-box">
            <strong>{currentProviderInfo.name}: </strong>
            <span>{currentProviderInfo.description}</span>
          </div>

          {/* API Key Input */}
          {localConfig.provider !== 'mock' && (
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                <span>API Key de {currentProviderInfo.name}:</span>
                {currentProviderInfo.keyUrl && (
                  <a
                    href={currentProviderInfo.keyUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ 
                      color: 'var(--accent-primary-light)', 
                      fontSize: '0.8rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 4,
                      fontWeight: 600,
                      textDecoration: 'underline'
                    }}
                  >
                    <Sparkles size={13} />
                    {currentProviderInfo.keyLinkText} <ExternalLink size={12} />
                  </a>
                )}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  className="form-input"
                  style={{ width: '100%', paddingLeft: 36 }}
                  placeholder={
                    localConfig.provider === 'gemini'
                      ? 'AQ.Ab8RN... o AIzaSy...'
                      : localConfig.provider === 'groq'
                      ? 'gsk_...'
                      : localConfig.provider === 'deepl'
                      ? 'ej: 12345678-abcd-...:fx'
                      : localConfig.provider === 'openai'
                      ? 'sk-proj-...'
                      : 'sk-ant-...'
                  }
                  value={localConfig.apiKey || ''}
                  onChange={(e) => setLocalConfig({ ...localConfig, apiKey: e.target.value })}
                />
                <Key
                  size={16}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
              </div>
              <p className="form-hint">
                {localConfig.provider === 'gemini' 
                  ? '💡 Tu clave de Google AI Studio / Gemini está lista para traducir con gemini-3.6-flash.'
                  : 'Tu API Key se almacena de forma segura en tu navegador (localStorage) o en variables de entorno Vercel.'}
              </p>
            </div>
          )}

          {/* Model selection for Gemini */}
          {localConfig.provider === 'gemini' && (
            <div className="form-group">
              <label className="form-label">Modelo de Gemini:</label>
              <select
                className="form-input"
                value={localConfig.model || 'gemini-3.6-flash'}
                onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value })}
              >
                <option value="gemini-3.6-flash">gemini-3.6-flash (Recomendado: Máxima velocidad y calidad)</option>
                <option value="gemini-3.7-flash">gemini-3.7-flash (Último modelo de razonamiento)</option>
                <option value="gemini-3.5-flash">gemini-3.5-flash</option>
              </select>
            </div>
          )}

          {/* Custom URL for LibreTranslate */}
          {localConfig.provider === 'libretranslate' && (
            <div className="form-group">
              <label className="form-label">URL de la Instancia LibreTranslate:</label>
              <input
                type="text"
                className="form-input"
                placeholder="https://translate.argosopentech.com/translate o tu host local"
                value={localConfig.customApiUrl || ''}
                onChange={(e) => setLocalConfig({ ...localConfig, customApiUrl: e.target.value })}
              />
            </div>
          )}

          {/* Model selection for OpenAI / Claude / Groq */}
          {(localConfig.provider === 'openai' || localConfig.provider === 'claude' || localConfig.provider === 'groq') && (
            <div className="form-group">
              <label className="form-label">Modelo a utilizar:</label>
              <select
                className="form-input"
                value={localConfig.model || (localConfig.provider === 'openai' ? 'gpt-4o-mini' : localConfig.provider === 'groq' ? 'llama-3.3-70b-versatile' : 'claude-3-5-haiku-20241022')}
                onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value })}
              >
                {localConfig.provider === 'groq' ? (
                  <>
                    <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Recomendado: Gran calidad)</option>
                    <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Ultra rápido)</option>
                  </>
                ) : localConfig.provider === 'openai' ? (
                  <>
                    <option value="gpt-4o-mini">gpt-4o-mini (Recomendado: Rápido y económico)</option>
                    <option value="gpt-4o">gpt-4o (Máxima capacidad de razonamiento)</option>
                  </>
                ) : (
                  <>
                    <option value="claude-3-5-haiku-20241022">claude-3-5-haiku (Rápido y preciso)</option>
                    <option value="claude-3-5-sonnet-20241022">claude-3-5-sonnet (Alta fidelidad literaria)</option>
                  </>
                )}
              </select>
            </div>
          )}

          {/* Execution Environment Toggle */}
          <div className="form-group">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={localConfig.useServerless}
                onChange={(e) => setLocalConfig({ ...localConfig, useServerless: e.target.checked })}
              />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                Usar endpoint serverless <code>/api/translate</code> (Vercel)
              </span>
            </label>
            <p className="form-hint" style={{ marginTop: 2 }}>
              Recomendado al desplegar en Vercel para no exponer keys en peticiones directas del cliente.
            </p>
          </div>

          {/* Test Status Banner */}
          {testStatus.message && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: testStatus.success ? 'var(--success-bg)' : 'var(--danger-bg)',
                border: `1px solid ${testStatus.success ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
                color: testStatus.success ? 'var(--success)' : 'var(--danger)',
                fontSize: '0.825rem',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {testStatus.success ? <Check size={16} /> : <AlertCircle size={16} />}
              <span>{testStatus.message}</span>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleTestConnection}
            disabled={testStatus.testing}
          >
            {testStatus.testing ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
            <span>Probar Conexión</span>
          </button>

          <button type="button" className="btn btn-primary" onClick={handleSave}>
            <ShieldCheck size={14} />
            <span>Guardar Configuración</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
