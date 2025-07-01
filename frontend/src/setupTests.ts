// src/setupTests.ts
import '@testing-library/jest-dom';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// אתחול בסיסי של i18next עבור הבדיקות:
i18n
  .use(initReactI18next)            // מוסיף את התמיכה ב-React
  .init({
    lng: 'en',                       // שפת ברירת מחדל
    fallbackLng: 'en',
    resources: {
      en: {
        translation: {
          welcome: 'Welcome',       // מפת המפתח 'welcome' ל-'Welcome'
        },
      },
    },
    interpolation: {
      escapeValue: false,            // רכיב React כבר מבצע בריחה
    },
  });
