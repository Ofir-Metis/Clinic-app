import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './i18n/en.json';
import he from './i18n/he.json';
import ar from './i18n/ar.json';
import ru from './i18n/ru.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    he: { translation: he },
    ar: { translation: ar },
    ru: { translation: ru },
  },
  lng: 'en',
  fallbackLng: 'en',
});

export default i18n;
