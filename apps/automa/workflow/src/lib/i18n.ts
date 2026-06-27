import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslation from '../locales/en/translation.json';
import viTranslation from '../locales/vi/translation.json';

const resources = {
  en: {
    translation: enTranslation,
  },
  vi: {
    translation: viTranslation,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'vi', // Mặc định là tiếng Việt
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React đã tự escape XSS
  },
});

export default i18n;
