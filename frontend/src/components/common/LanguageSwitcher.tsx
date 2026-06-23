import React, { useState } from 'react';
import { Globe, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, LANGUAGE_NAMES, type SupportedLanguage } from '../../i18n';

/**
 * Language switcher dropdown (Uzbek / English / Russian). The selection is
 * persisted to localStorage by the i18next language detector.
 */
const LanguageSwitcher: React.FC = () => {
    const { i18n, t } = useTranslation();
    const [open, setOpen] = useState(false);

    const current = (SUPPORTED_LANGUAGES as readonly string[]).includes(i18n.language)
        ? (i18n.language as SupportedLanguage)
        : 'uz';

    const choose = (lang: SupportedLanguage) => {
        i18n.changeLanguage(lang);
        setOpen(false);
    };

    return (
        <div className="dropdown" onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}>
            <button
                className="btn btn-ghost btn-icon"
                onClick={() => setOpen((v) => !v)}
                title={t('language.label')}
                aria-label={t('language.label')}
                aria-haspopup="menu"
                aria-expanded={open}
                style={{ marginRight: 'var(--space-2)' }}
            >
                <Globe size={20} strokeWidth={1.85} aria-hidden="true" />
            </button>

            {open && (
                <>
                    <div
                        style={{ position: 'fixed', inset: 0, zIndex: 'var(--z-dropdown)' }}
                        onClick={() => setOpen(false)}
                    />
                    <div className="dropdown-menu" role="menu" style={{ marginTop: 'var(--space-2)' }}>
                        {SUPPORTED_LANGUAGES.map((lang) => (
                            <button
                                key={lang}
                                className="dropdown-item"
                                role="menuitemradio"
                                aria-checked={current === lang}
                                onClick={() => choose(lang)}
                            >
                                <span style={{ flex: 1, textAlign: 'left' }}>{LANGUAGE_NAMES[lang]}</span>
                                {current === lang && <Check size={16} strokeWidth={2} aria-hidden="true" />}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default LanguageSwitcher;
