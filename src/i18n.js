// i18n setup — English (default) + Hebrew (RTL).
// Language is detected from localStorage → browser, cached to localStorage under
// `i18nextLng` (the same key the no-flash script in index.html reads before paint).
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import he from './locales/he.json';

export const LANGS = [
  { code: 'en', label: 'EN', dir: 'ltr' },
  { code: 'he', label: 'עב', dir: 'rtl' },
];

export function dirFor(lng) {
  return (lng || '').startsWith('he') ? 'rtl' : 'ltr';
}

// Keep <html lang> + dir in sync with the active language.
function applyDir(lng) {
  const el = document.documentElement;
  el.lang = lng || 'en';
  el.dir = dirFor(lng);
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, he: { translation: he } },
    fallbackLng: 'en',
    supportedLngs: ['en', 'he'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  });

applyDir(i18n.language);
i18n.on('languageChanged', applyDir);

export default i18n;
