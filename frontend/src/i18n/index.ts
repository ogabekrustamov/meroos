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

export default i18n;
