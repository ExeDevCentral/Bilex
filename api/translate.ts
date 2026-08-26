declare const process: { env: Record<string, string | undefined> };

// Vercel Serverless Function: /api/translate
export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const {
      texts,
      sourceLang = 'EN',
      targetLang = 'ES',
      provider = 'gemini',
      apiKey,
      model,
      customApiUrl,
    } = req.body || {};

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ error: 'Falta el parámetro "texts" (debe ser un array no vacío de strings).' });
    }

    // 1. Google Gemini API (Free tier in Google AI Studio, no credit card required)
    if (provider === 'gemini') {
      const geminiKey = apiKey || process.env.GEMINI_API_KEY;
      if (!geminiKey) {
        return res.status(401).json({
          error: 'No se encontró la API Key de Google Gemini. Obtenela gratis sin tarjeta en Google AI Studio (aistudio.google.com).',
        });
      }

      const selectedModel = model || 'gemini-3.6-flash';
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${geminiKey}`;

      const prompt = `Translate the following JSON array of paragraphs from ${sourceLang} to ${targetLang}.
Preserve paragraph count, formatting, tone, style and nuances. Output ONLY a valid JSON array of translated strings with the exact same length as the input array:
${JSON.stringify(texts)}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({ error: `Error de Google Gemini API (${response.status})`, details: errText });
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      const parsed = JSON.parse(rawText);
      const translations = Array.isArray(parsed) ? parsed : (parsed.translations || Object.values(parsed));
      return res.status(200).json({ translations, provider: 'gemini' });
    }

    // 2. Groq API (Free tier, ultra-fast Llama 3.3)
    if (provider === 'groq') {
      const groqKey = apiKey || process.env.GROQ_API_KEY;
      if (!groqKey) {
        return res.status(401).json({
          error: 'No se encontró la API Key de Groq. Obtenela gratis en console.groq.com.',
        });
      }

      const selectedModel = model || 'llama-3.3-70b-versatile';
      const prompt = `Translate the following JSON array of paragraphs from ${sourceLang} to ${targetLang}.
Preserve exact paragraph count, formatting, tone, and line breaks. Return ONLY a valid JSON array of translated strings with the exact same length:
${JSON.stringify(texts)}`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            {
              role: 'system',
              content: 'You are an expert multilingual document translator. You output only valid JSON arrays of strings matching the input length.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.2,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({ error: `Error de Groq API (${response.status})`, details: errText });
      }

      const data = await response.json();
      const rawContent = data.choices?.[0]?.message?.content || '{}';
      const parsed = JSON.parse(rawContent);
      const translations = Array.isArray(parsed) ? parsed : (parsed.translations || Object.values(parsed));
      return res.status(200).json({ translations, provider: 'groq' });
    }

    // 3. DeepL Translation
    if (provider === 'deepl') {
      const deeplKey = apiKey || process.env.DEEPL_API_KEY;
      if (!deeplKey) {
        return res.status(401).json({
          error: 'No se encontró la API Key de DeepL. Configurala en las variables de entorno de Vercel (DEEPL_API_KEY) o en la configuración de la app.',
        });
      }

      const isFreeTier = deeplKey.endsWith(':fx');
      const deeplEndpoint = isFreeTier
        ? 'https://api-free.deepl.com/v2/translate'
        : 'https://api.deepl.com/v2/translate';

      const formattedTargetLang = targetLang.toUpperCase() === 'EN' ? 'EN-US' : targetLang.toUpperCase();
      
      const payload: any = {
        text: texts,
        target_lang: formattedTargetLang,
      };

      if (sourceLang && sourceLang !== 'AUTO') {
        payload.source_lang = sourceLang.toUpperCase().slice(0, 2);
      }

      const response = await fetch(deeplEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${deeplKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        if (response.status === 403 || response.status === 401) {
          return res.status(401).json({ error: 'API Key de DeepL inválida o sin autorización.', details: errText });
        }
        if (response.status === 456) {
          return res.status(429).json({ error: 'Límite de cuota de DeepL alcanzado (Quota exceeded).', details: errText });
        }
        return res.status(response.status).json({ error: `Error de DeepL API (${response.status})`, details: errText });
      }

      const data = await response.json();
      const translations = data.translations.map((t: any) => t.text);
      return res.status(200).json({ translations, provider: 'deepl' });
    }

    // 4. OpenAI Translation (GPT-4o-mini / GPT-4o)
    if (provider === 'openai') {
      const openAiKey = apiKey || process.env.OPENAI_API_KEY;
      if (!openAiKey) {
        return res.status(401).json({
          error: 'No se encontró la API Key de OpenAI (OPENAI_API_KEY).',
        });
      }

      const selectedModel = model || 'gpt-4o-mini';
      const prompt = `Translate the following JSON array of paragraphs from ${sourceLang} to ${targetLang}. 
Maintain the exact paragraph count, tone, nuances, formatting, and return ONLY a valid JSON array of strings:
${JSON.stringify(texts)}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            {
              role: 'system',
              content: 'You are an expert multilingual document translator. You output only valid JSON array of strings with translated text matching the exact input length.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.2,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({ error: `Error de OpenAI API (${response.status})`, details: errText });
      }

      const data = await response.json();
      const rawContent = data.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(rawContent);
      const translations = Array.isArray(parsed) ? parsed : (parsed.translations || Object.values(parsed));
      return res.status(200).json({ translations, provider: 'openai' });
    }

    // 5. Anthropic Claude Translation
    if (provider === 'claude') {
      const claudeKey = apiKey || process.env.ANTHROPIC_API_KEY;
      if (!claudeKey) {
        return res.status(401).json({
          error: 'No se encontró la API Key de Anthropic (ANTHROPIC_API_KEY).',
        });
      }

      const selectedModel = model || 'claude-3-5-haiku-20241022';
      const prompt = `Translate the following array of paragraphs from ${sourceLang} to ${targetLang}. Return ONLY a valid JSON array of translated strings with the exact same count as input.
Input:
${JSON.stringify(texts)}`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': claudeKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          max_tokens: 4096,
          temperature: 0.2,
          system: 'You are an expert translator. Output ONLY a valid JSON array of strings corresponding to the translated paragraphs.',
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({ error: `Error de Anthropic API (${response.status})`, details: errText });
      }

      const data = await response.json();
      const rawContent = data.content?.[0]?.text || '[]';
      const cleanJson = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
      const translations = JSON.parse(cleanJson);
      return res.status(200).json({ translations, provider: 'claude' });
    }

    // 6. LibreTranslate
    if (provider === 'libretranslate') {
      const endpoint = customApiUrl || process.env.LIBRETRANSLATE_URL || 'https://translate.argosopentech.com/translate';
      const translations: string[] = [];

      for (const text of texts) {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q: text,
            source: sourceLang.toLowerCase(),
            target: targetLang.toLowerCase(),
            format: 'text',
            api_key: apiKey || process.env.LIBRETRANSLATE_API_KEY || '',
          }),
        });

        if (!response.ok) {
          const err = await response.text();
          throw new Error(`LibreTranslate error (${response.status}): ${err}`);
        }

        const data = await response.json();
        translations.push(data.translatedText || text);
      }

      return res.status(200).json({ translations, provider: 'libretranslate' });
    }

    // 7. Mock / Demo Mode
    if (provider === 'mock') {
      const mockTranslations = texts.map((t: string) => {
        return `[Traducción al ${targetLang}]: ${t}`;
      });
      return res.status(200).json({ translations: mockTranslations, provider: 'mock' });
    }

    return res.status(400).json({ error: `Proveedor de traducción no reconocido: "${provider}"` });
  } catch (error: any) {
    console.error('Serverless translation error:', error);
    return res.status(500).json({
      error: 'Error interno en la traducción serverless.',
      message: error.message || String(error),
    });
  }
}
