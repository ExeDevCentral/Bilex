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
  Sliders 
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
        if (localConfig.provider === 'deepl') {
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

  const currentProviderInfo = PROVIDER_INFO[localConfig.provider];

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
            <label className="form-label">Proveedor de Traducción:</label>
            <div className="provider-grid">
              {(['deepl', 'openai', 'claude', 'libretranslate', 'mock'] as TranslationProvider[]).map((prov) => (
                <button
                  key={prov}
                  type="button"
                  className={`provider-card ${localConfig.provider === prov ? 'is-selected' : ''}`}
                  onClick={() => handleProviderSelect(prov)}
                >
                  <strong className="provider-card-title">
                    {prov === 'deepl' && 'DeepL (Default)'}
                    {prov === 'openai' && 'OpenAI (GPT)'}
                    {prov === 'claude' && 'Anthropic (Claude)'}
                    {prov === 'libretranslate' && 'LibreTranslate'}
                    {prov === 'mock' && 'Modo Demo (Mock)'}
                  </strong>
                  <span className="provider-card-desc">
                    {PROVIDER_INFO[prov].freeTier}
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
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>API Key de {PROVIDER_INFO[localConfig.provider].name}:</span>
                {localConfig.provider === 'deepl' && (
                  <a
                    href="https://www.deepl.com/pro-api"
                    target="_blank"
                    rel="noreferrer"
                    style={{ 
                      color: 'var(--accent-primary-light)', 
                      fontSize: '0.78rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 4,
                      textDecoration: 'underline'
                    }}
                  >
                    Obtener DeepL Key gratis <ExternalLink size={12} />
                  </a>
                )}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  className="form-input"
                  style={{ width: '100%', paddingLeft: 36 }}
                  placeholder={
                    localConfig.provider === 'deepl'
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
                Tu API Key se almacena de forma segura en tu navegador (localStorage) o en variables de entorno Vercel.
              </p>
            </div>
          )}

          {/* Custom URL for LibreTranslate */}
          {localConfig.provider === 'libretranslate' && (
            <div className="form-group">
              <label className="form-label">URL de la Instancia LibreTranslate:</label>
              <input
                type="text"
                className="form-input"
                placeholder="https://libretranslate.com/translate o tu host"
                value={localConfig.customApiUrl || ''}
                onChange={(e) => setLocalConfig({ ...localConfig, customApiUrl: e.target.value })}
              />
            </div>
          )}

          {/* Model selection for OpenAI / Claude */}
          {(localConfig.provider === 'openai' || localConfig.provider === 'claude') && (
            <div className="form-group">
              <label className="form-label">Modelo a utilizar:</label>
              <select
                className="form-input"
                value={localConfig.model || (localConfig.provider === 'openai' ? 'gpt-4o-mini' : 'claude-3-5-haiku-20241022')}
                onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value })}
              >
                {localConfig.provider === 'openai' ? (
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
