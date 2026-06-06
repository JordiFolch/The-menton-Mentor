import { franc } from 'franc';

const CONFIDENCE_THRESHOLD = 0.7;
const MIN_TEXT_LENGTH = 50;

const LOCALE_MAP: Record<string, string> = {
  cat: 'ca-ES',
  spa: 'es-ES',
  eng: 'en-US',
  fra: 'fr-FR',
  deu: 'de-DE',
  ita: 'it-IT',
  por: 'pt-PT',
  jpn: 'ja-JP',
  cmn: 'zh-CN',
  ara: 'ar-SA',
  rus: 'ru-RU',
  kor: 'ko-KR',
};

export function detectLanguage(text: string): string | null {
  if (text.length < MIN_TEXT_LENGTH) return null;

  const result = franc(text, { minLength: 10 });
  if (result === 'und') return null;

  return LOCALE_MAP[result] ?? null;
}

export function francToLocale(francCode: string): string {
  return LOCALE_MAP[francCode] ?? 'en-US';
}

export function localeLabel(locale: string): string {
  const labels: Record<string, string> = {
    'ca-ES': 'CA',
    'es-ES': 'ES',
    'en-US': 'EN',
    'fr-FR': 'FR',
    'de-DE': 'DE',
    'it-IT': 'IT',
    'pt-PT': 'PT',
    'ja-JP': 'JA',
    'zh-CN': 'ZH',
    'ar-SA': 'AR',
    'ru-RU': 'RU',
    'ko-KR': 'KO',
  };
  return labels[locale] ?? locale.split('-')[0].toUpperCase();
}
