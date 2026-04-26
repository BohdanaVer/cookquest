import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ukTranslation from '../locales/uk.json';
import enTranslation from '../locales/en.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            UK: { translation: ukTranslation },
            EN: { translation: enTranslation }
        },
        fallbackLng: 'UK',
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;