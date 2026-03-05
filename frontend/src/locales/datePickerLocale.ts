/**
 * Dynamic date picker locale configuration
 * Returns the correct date-fns locale and MUI picker locale text
 * based on the application's current language setting.
 */
import { enUS, es, he } from 'date-fns/locale';
import { hebrewPickersLocaleText } from './hebrewPickersLocale';
import type { SupportedLanguage } from '../i18n/index';

const dateFnsLocaleMap: Record<SupportedLanguage, typeof enUS> = {
  en: enUS,
  es: es,
  he: he,
};

const pickersLocaleTextMap: Record<SupportedLanguage, typeof hebrewPickersLocaleText | undefined> = {
  en: undefined,
  es: undefined,
  he: hebrewPickersLocaleText,
};

export function getDatePickerLocale(language: SupportedLanguage) {
  return {
    adapterLocale: dateFnsLocaleMap[language] ?? enUS,
    localeText: pickersLocaleTextMap[language],
  };
}
