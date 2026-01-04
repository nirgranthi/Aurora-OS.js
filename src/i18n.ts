import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { STORAGE_KEYS } from './utils/memory';

// Import translations directly for now (bundled strategy)
import commonEn from './locales/en/common.json';

const resources = {
  en: {
    translation: commonEn
  }
};

// Detect language from storage or default to 'en'
const getStoredLanguage = () => {
  try {
    return localStorage.getItem(STORAGE_KEYS.LANGUAGE) || 'en';
  } catch {
    return 'en';
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getStoredLanguage(),
    fallbackLng: 'en',
    
    interpolation: {
      escapeValue: false // React already safes from xss
    },

    react: {
      useSuspense: false // Avoid suspense for now as we bundle JSONs
    }
  });

export default i18n;
