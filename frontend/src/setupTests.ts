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
          login: 'Login',
          register: 'Register',
          fullName: 'Full Name',
          email: 'Email',
          password: 'Password',
          therapist: 'Therapist',
          patient: 'Patient',
          or: 'or',
          required: 'Required',
        },
      },
    },
    interpolation: {
      escapeValue: false,            // רכיב React כבר מבצע בריחה
    },
  });

jest.spyOn(console, 'warn').mockImplementation((msg) => {
  if (
    typeof msg === 'string' &&
    (msg.includes('React Router Future Flag Warning') ||
      msg.includes('Relative route resolution within Splat routes is changing'))
  ) {
    return;
  }
  // Uncomment to see other warnings
  // console.warn(msg);
});
