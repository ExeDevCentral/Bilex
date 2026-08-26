import { franc } from 'franc-min';
import { SUPPORTED_LANGUAGES } from '../constants/languages';

const ISO3_TO_ISO2: Record<string, string> = {
  eng: 'EN',
  spa: 'ES',
  fra: 'FR',
  deu: 'DE',
  ita: 'IT',
  por: 'PT',
  rus: 'RU',
  cmn: 'ZH',
  zho: 'ZH',
  jpn: 'JA',
  kor: 'KO',
  nld: 'NL',
  pol: 'PL',
};

export interface DetectionResult {
  code: string; // e.g. 'EN'
  iso3: string; // e.g. 'eng'
  name: string;
  flag: string;
  isReliable: boolean;
}

/**
 * Detects the language of a given text string using franc-min offline n-grams
 */
export function detectLanguageFromText(text: string): DetectionResult | null {
  const cleanText = text.trim();
  if (cleanText.length < 25) {
    return null; // Text is too short for reliable n-gram detection
  }

  const iso3 = franc(cleanText, { minLength: 15 });

  if (!iso3 || iso3 === 'und') {
    return null;
  }

  const iso2 = ISO3_TO_ISO2[iso3];
  if (!iso2) {
    return null;
  }

  const matchedLang = SUPPORTED_LANGUAGES.find((l) => l.code === iso2);
  if (!matchedLang) {
    return null;
  }

  return {
    code: matchedLang.code,
    iso3,
    name: matchedLang.name,
    flag: matchedLang.flag,
    isReliable: cleanText.length > 60,
  };
}
