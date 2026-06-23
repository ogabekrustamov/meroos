import { describe, it, expect } from 'vitest';
import { localeFromLng } from './index';

describe('localeFromLng', () => {
    it('maps supported languages to BCP-47 locales', () => {
        expect(localeFromLng('en')).toBe('en-US');
        expect(localeFromLng('ru')).toBe('ru-RU');
        expect(localeFromLng('uz')).toBe('uz-Latn-UZ');
    });

    it('reads only the primary subtag of regioned codes', () => {
        expect(localeFromLng('en-GB')).toBe('en-US');
        expect(localeFromLng('ru-RU')).toBe('ru-RU');
    });

    it('falls back to Uzbek for unknown or missing values', () => {
        expect(localeFromLng('fr')).toBe('uz-Latn-UZ');
        expect(localeFromLng(undefined)).toBe('uz-Latn-UZ');
        expect(localeFromLng('')).toBe('uz-Latn-UZ');
    });
});
