import type { ParagraphPair, TranslationConfig } from '../types';

export interface TranslationProgressCallback {
  (currentChunk: number, totalChunks: number, updatedPairs: ParagraphPair[]): void;
}

/**
 * Translates an array of texts using DeepL API directly from the client
 */
async function translateWithDeepLClient(
  texts: string[],
  config: TranslationConfig
): Promise<string[]> {
  const apiKey = config.apiKey?.trim();
  if (!apiKey) {
    throw new Error('Por favor ingresa tu API Key de DeepL en la Configuración.');
  }

  const isFreeTier = apiKey.endsWith(':fx');
  const endpoint = isFreeTier
    ? 'https://api-free.deepl.com/v2/translate'
    : 'https://api.deepl.com/v2/translate';

  const targetLang = config.targetLang.toUpperCase() === 'EN' ? 'EN-US' : config.targetLang.toUpperCase();

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `DeepL-Auth-Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: texts,
      target_lang: targetLang,
      ...(config.sourceLang && config.sourceLang !== 'AUTO' ? { source_lang: config.sourceLang.toUpperCase().slice(0, 2) } : {}),
      ...(config.formality && config.formality !== 'default' ? { formality: config.formality } : {}),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 403 || response.status === 401) {
      throw new Error('API Key de DeepL inválida o sin permisos.');
    }
    if (response.status === 456) {
      throw new Error('Límite de cuota de DeepL alcanzado (500k caracteres superados).');
    }
    throw new Error(`Error de DeepL (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.translations.map((t: { text: string }) => t.text);
}

/**
 * Translates texts using OpenAI API directly from client
 */
async function translateWithOpenAIClient(
  texts: string[],
  config: TranslationConfig
): Promise<string[]> {
  const apiKey = config.apiKey?.trim();
  if (!apiKey) {
    throw new Error('Por favor ingresa tu API Key de OpenAI en la Configuración.');
  }

  const model = config.model || 'gpt-4o-mini';
  const prompt = `Translate the following JSON array of paragraphs from ${config.sourceLang} to ${config.targetLang}.
Preserve paragraph count, formatting, tone, and line breaks. Return ONLY a valid JSON array of translated strings with the exact same length:
${JSON.stringify(texts)}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are a professional literary and technical translator. You only output valid JSON arrays of strings.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Error de OpenAI API (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const raw = data.choices[0]?.message?.content || '{}';
  const parsed = JSON.parse(raw);
  const translations = Array.isArray(parsed) ? parsed : (parsed.translations || Object.values(parsed));
  return translations;
}

/**
 * Translates texts using Anthropic Claude API directly from client
 */
async function translateWithClaudeClient(
  texts: string[],
  config: TranslationConfig
): Promise<string[]> {
  const apiKey = config.apiKey?.trim();
  if (!apiKey) {
    throw new Error('Por favor ingresa tu API Key de Anthropic en la Configuración.');
  }

  const model = config.model || 'claude-3-5-haiku-20241022';
  const prompt = `Translate the following JSON array of paragraphs from ${config.sourceLang} to ${config.targetLang}. Return ONLY a valid JSON array of translated strings:
${JSON.stringify(texts)}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'dangerously-allow-browser': 'true',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Error de Claude API (${response.status}): ${err}`);
  }

  const data = await response.json();
  const raw = data.content?.[0]?.text || '[]';
  const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(clean);
}

/**
 * Translates texts using LibreTranslate
 */
async function translateWithLibreTranslate(
  texts: string[],
  config: TranslationConfig
): Promise<string[]> {
  const endpoint = config.customApiUrl || 'https://libretranslate.com/translate';
  const translations: string[] = [];

  for (const text of texts) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: config.sourceLang.toLowerCase(),
        target: config.targetLang.toLowerCase(),
        format: 'text',
        api_key: config.apiKey || '',
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`LibreTranslate error (${response.status}): ${err}`);
    }

    const data = await response.json();
    translations.push(data.translatedText || text);
  }

  return translations;
}

/**
 * Mock translation for immediate offline testing
 */
function translateWithMock(texts: string[], targetLang: string): string[] {
  const dictionary: Record<string, string> = {
    'the': 'el',
    'this': 'este',
    'is': 'es',
    'a': 'un',
    'document': 'documento',
    'text': 'texto',
    'translation': 'traducción',
    'reading': 'lectura',
    'dual': 'dual',
    'view': 'vista',
    'system': 'sistema',
    'application': 'aplicación',
    'image': 'imagen',
    'process': 'proceso',
    'complete': 'completo',
    'example': 'ejemplo',
    'overview': 'descripción general',
    'introduction': 'introducción',
    'conclusion': 'conclusión',
  };

  return texts.map((text) => {
    if (targetLang.toUpperCase() === 'ES') {
      const words = text.split(' ');
      const simulated = words
        .map((w) => {
          const clean = w.toLowerCase().replace(/[^a-z]/g, '');
          const mapped = dictionary[clean];
          if (mapped) {
            return w.replace(new RegExp(clean, 'i'), mapped);
          }
          return w;
        })
        .join(' ');

      return `[${targetLang}] ${simulated.charAt(0).toUpperCase() + simulated.slice(1)}`;
    }
    return `[Traducción al ${targetLang}]: ${text}`;
  });
}

/**
 * Executes translation for a single batch of texts
 */
async function translateBatch(
  texts: string[],
  config: TranslationConfig
): Promise<string[]> {
  // If explicitly mock mode
  if (config.provider === 'mock') {
    await new Promise((resolve) => setTimeout(resolve, 600)); // Simulate natural delay
    return translateWithMock(texts, config.targetLang);
  }

  // 1. Try Vercel serverless function if enabled
  if (config.useServerless) {
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texts,
          sourceLang: config.sourceLang,
          targetLang: config.targetLang,
          provider: config.provider,
          apiKey: config.apiKey,
          model: config.model,
          customApiUrl: config.customApiUrl,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.translations;
      }

      // If serverless is 404 (local vite server without Vercel backend), fallback gracefully to direct client
      if (response.status === 404) {
        console.warn('Endpoint /api/translate no disponible en entorno local, usando llamada directa del cliente.');
      } else {
        const errJson = await response.json().catch(() => null);
        throw new Error(errJson?.error || `Error en /api/translate (${response.status})`);
      }
    } catch (err: any) {
      if (config.apiKey) {
        console.warn('Fallo serverless, probando cliente directo con la API key configurada:', err);
      } else {
        throw err;
      }
    }
  }

  // 2. Direct client call based on provider
  switch (config.provider) {
    case 'deepl':
      return translateWithDeepLClient(texts, config);
    case 'openai':
      return translateWithOpenAIClient(texts, config);
    case 'claude':
      return translateWithClaudeClient(texts, config);
    case 'libretranslate':
      return translateWithLibreTranslate(texts, config);
    default:
      return translateWithMock(texts, config.targetLang);
  }
}

/**
 * Main translation pipeline: batches paragraphs, translates incrementally, and reports live progress
 */
export async function translateDocumentParagraphs(
  pairs: ParagraphPair[],
  config: TranslationConfig,
  onProgress?: TranslationProgressCallback
): Promise<ParagraphPair[]> {
  if (pairs.length === 0) return [];

  const updatedPairs: ParagraphPair[] = pairs.map((p) => ({ ...p, status: 'pending' }));
  
  // Group into chunks by character count (approx 1500 chars) and count (max 8 per batch)
  const chunks: number[][] = []; // stores indices of paragraphs
  let currentChunk: number[] = [];
  let currentChars = 0;

  for (let i = 0; i < updatedPairs.length; i++) {
    const textLen = updatedPairs[i].original.length;
    if (currentChunk.length >= 8 || (currentChars + textLen > 1800 && currentChunk.length > 0)) {
      chunks.push(currentChunk);
      currentChunk = [i];
      currentChars = textLen;
    } else {
      currentChunk.push(i);
      currentChars += textLen;
    }
  }
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  const totalChunks = chunks.length;

  for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
    const indices = chunks[chunkIdx];
    const textsToTranslate = indices.map((idx) => updatedPairs[idx].original);

    // Mark current chunk as translating
    for (const idx of indices) {
      updatedPairs[idx].status = 'translating';
    }
    onProgress?.(chunkIdx + 1, totalChunks, [...updatedPairs]);

    try {
      const translatedTexts = await translateBatch(textsToTranslate, config);

      for (let i = 0; i < indices.length; i++) {
        const pairIndex = indices[i];
        updatedPairs[pairIndex].translated = translatedTexts[i] || '[Error al traducir este párrafo]';
        updatedPairs[pairIndex].status = 'done';
      }
    } catch (err: any) {
      console.error(`Error translating chunk ${chunkIdx + 1}:`, err);
      for (const idx of indices) {
        updatedPairs[idx].status = 'error';
        updatedPairs[idx].errorMessage = err.message || 'Error en la traducción';
        updatedPairs[idx].translated = `[Error: ${err.message || 'Fallo de traducción'}]`;
      }
      throw err;
    }

    onProgress?.(chunkIdx + 1, totalChunks, [...updatedPairs]);
  }

  return updatedPairs;
}
