import type { LanguageOption } from '../types';

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'ES', name: 'Español', flag: '🇪🇸', deeplCode: 'ES', tesseractCode: 'spa' },
  { code: 'EN', name: 'Inglés', flag: '🇬🇧', deeplCode: 'EN-US', tesseractCode: 'eng' },
  { code: 'FR', name: 'Francés', flag: '🇫🇷', deeplCode: 'FR', tesseractCode: 'fra' },
  { code: 'DE', name: 'Alemán', flag: '🇩🇪', deeplCode: 'DE', tesseractCode: 'deu' },
  { code: 'IT', name: 'Italiano', flag: '🇮🇹', deeplCode: 'IT', tesseractCode: 'ita' },
  { code: 'PT', name: 'Portugués', flag: '🇵🇹', deeplCode: 'PT-PT', tesseractCode: 'por' },
  { code: 'RU', name: 'Ruso', flag: '🇷🇺', deeplCode: 'RU', tesseractCode: 'rus' },
  { code: 'ZH', name: 'Chino', flag: '🇨🇳', deeplCode: 'ZH', tesseractCode: 'chi_sim' },
  { code: 'JA', name: 'Japonés', flag: '🇯🇵', deeplCode: 'JA', tesseractCode: 'jpn' },
  { code: 'KO', name: 'Coreano', flag: '🇰🇷', deeplCode: 'KO', tesseractCode: 'kor' },
  { code: 'NL', name: 'Holandés', flag: '🇳🇱', deeplCode: 'NL', tesseractCode: 'nld' },
  { code: 'PL', name: 'Polaco', flag: '🇵🇱', deeplCode: 'PL', tesseractCode: 'pol' },
];

export const OCR_LANGUAGES = [
  { code: 'eng+spa', name: 'Inglés + Español (Recomendado)', tesseractCode: 'eng+spa' },
  { code: 'eng', name: 'Inglés (English)', tesseractCode: 'eng' },
  { code: 'spa', name: 'Español', tesseractCode: 'spa' },
  { code: 'fra', name: 'Francés (Français)', tesseractCode: 'fra' },
  { code: 'deu', name: 'Alemán (Deutsch)', tesseractCode: 'deu' },
  { code: 'ita', name: 'Italiano', tesseractCode: 'ita' },
  { code: 'por', name: 'Portugués (Português)', tesseractCode: 'por' },
];

export const PROVIDER_INFO = {
  deepl: {
    name: 'DeepL API',
    description: 'La más alta calidad y fluidez natural para traducciones generales y académicas.',
    requiresKey: true,
    freeTier: '500.000 caracteres / mes gratis',
    defaultUrl: 'https://api-free.deepl.com/v2/translate',
  },
  openai: {
    name: 'OpenAI (GPT-4o / GPT-4o-mini)',
    description: 'Excelente para documentos técnicos y comprensión profunda del contexto.',
    requiresKey: true,
    freeTier: 'De pago por token (muy económico con mini)',
    defaultModel: 'gpt-4o-mini',
  },
  claude: {
    name: 'Anthropic Claude (Claude 3.5 Haiku)',
    description: 'Traducciones estilizadas con máximo rigor contextual y terminología especializada.',
    requiresKey: true,
    freeTier: 'De pago por token',
    defaultModel: 'claude-3-5-haiku-20241022',
  },
  libretranslate: {
    name: 'LibreTranslate (Open Source)',
    description: 'Sin dependencias corporativas. Instancia pública u hospedaje propio.',
    requiresKey: false,
    freeTier: 'Gratis / Open Source',
    defaultUrl: 'https://libretranslate.com/translate',
  },
  mock: {
    name: 'Modo Demo / Offline Mock',
    description: 'Genera traducciones simuladas de prueba instantáneamente sin consumir APIs ni requerir keys.',
    requiresKey: false,
    freeTier: '100% Gratis e ilimitado',
  },
};
