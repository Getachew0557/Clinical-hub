import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en/translation.json';
import am from './locales/am/translation.json';
import ti from './locales/ti/translation.json';
import om from './locales/om/translation.json';
import so from './locales/so/translation.json';

const SUPPORTED_LANGS = ['en', 'am', 'ti', 'om', 'so'];
const ETHIOPIC_LANGS = ['am', 'ti'];

// Toggle Ethiopic font class on <html>
const applyFontClass = (lang) => {
    if (ETHIOPIC_LANGS.includes(lang)) {
        document.documentElement.classList.add('lang-ethiopic');
    } else {
        document.documentElement.classList.remove('lang-ethiopic');
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            am: { translation: am },
            ti: { translation: ti },
            om: { translation: om },
            so: { translation: so },
        },
        fallbackLng: 'en',
        supportedLngs: SUPPORTED_LANGS,
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
            lookupLocalStorage: 'i18nextLng',
        },
        interpolation: {
            escapeValue: false,
        },
    });

// Apply font class on init
i18n.on('initialized', () => {
    applyFontClass(i18n.language);
});

// Apply font class on every language change
i18n.on('languageChanged', (lang) => {
    applyFontClass(lang);
});

export default i18n;
