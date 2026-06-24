/**
 * i18n setup — Uzbek (default/fallback), English, Russian.
 *
 * Strings live in ./locales/<lang>.json. The active language is detected from
 * localStorage (key `meroos_lang`) first, then the browser, falling back to
 * Uzbek. The chosen language is cached back to localStorage.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import uz from './locales/uz.json';
import en from './locales/en.json';
import ru from './locales/ru.json';

export const SUPPORTED_LANGUAGES = ['uz', 'en', 'ru'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/** Autonyms shown in the language switcher. */
export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
    uz: "O‘zbekcha",
    en: 'English',
    ru: 'Русский',
};

/** Emoji flags shown next to each language so the active one is recognisable at a glance. */
export const LANGUAGE_FLAGS: Record<SupportedLanguage, string> = {
    uz: '🇺🇿',
    en: '🇬🇧',
    ru: '🇷🇺',
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            uz: { translation: uz },
            en: { translation: en },
            ru: { translation: ru },
        },
        fallbackLng: 'uz',
        supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
        nonExplicitSupportedLngs: true, // map en-US -> en, ru-RU -> ru, etc.
        interpolation: {
            escapeValue: false, // React already escapes
        },
        detection: {
            order: ['localStorage', 'navigator'],
            lookupLocalStorage: 'meroos_lang',
            caches: ['localStorage'],
        },
    });

/**
 * Maps an i18n language code to a BCP-47 locale for Intl/`toLocaleDateString`,
 * so dates and numbers follow the chosen UI language. Tolerates regioned
 * codes like `en-US` by reading only the primary subtag.
 */
export const localeFromLng = (lng?: string): string => {
    switch ((lng || 'uz').split('-')[0]) {
        case 'ru':
            return 'ru-RU';
        case 'en':
            return 'en-US';
        case 'uz':
        default:
            return 'uz-Latn-UZ';
    }
};

// Keep <html lang> in sync with the active language so screen readers and
// browsers use the correct pronunciation/typography for the page.
const applyHtmlLang = (lng?: string) => {
    if (typeof document !== 'undefined') {
        document.documentElement.lang = (lng || 'uz').split('-')[0];
    }
};
applyHtmlLang(i18n.language);
i18n.on('languageChanged', applyHtmlLang);

export default i18n;
