/**
 * Internationalization Configuration
 * Manages multiple languages with self-development focused translations
 */

import { en } from './translations/en';
import { es } from './translations/es';
import { he } from './translations/he';

export type SupportedLanguage = 'en' | 'es' | 'he';

export interface Language {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  rtl: boolean;
  description: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    rtl: false,
    description: 'The language of opportunity and global connection'
  },
  {
    code: 'es', 
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    rtl: false,
    description: 'The language of passion and transformation'
  },
  {
    code: 'he',
    name: 'Hebrew',
    nativeName: 'עברית',
    flag: '🇮🇱',
    rtl: true,
    description: 'The language of ancient wisdom and modern innovation'
  }
];

export const translations = {
  en,
  es,
  he
};

export type TranslationKeys = typeof en;

// Storage key for language preference
export const LANGUAGE_STORAGE_KEY = 'clinic-app-language';

// Default language
export const DEFAULT_LANGUAGE: SupportedLanguage = 'he';

// Helper function to get browser language
export const getBrowserLanguage = (): SupportedLanguage => {
  if (typeof navigator === 'undefined') return DEFAULT_LANGUAGE;
  
  const browserLang = navigator.language.split('-')[0] as SupportedLanguage;
  return SUPPORTED_LANGUAGES.find(lang => lang.code === browserLang)?.code || DEFAULT_LANGUAGE;
};

// Helper function to get stored language preference
export const getStoredLanguage = (): SupportedLanguage => {
  if (typeof localStorage === 'undefined') return DEFAULT_LANGUAGE;
  
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY) as SupportedLanguage;
  return SUPPORTED_LANGUAGES.find(lang => lang.code === stored)?.code || DEFAULT_LANGUAGE;
};

// Helper function to store language preference
export const storeLanguage = (language: SupportedLanguage): void => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }
};

// Helper function to get initial language
export const getInitialLanguage = (): SupportedLanguage => {
  // Priority: stored preference > default language (Hebrew)
  const stored = getStoredLanguage();
  // If there's a valid stored preference, use it; otherwise default to Hebrew
  if (stored && SUPPORTED_LANGUAGES.find(lang => lang.code === stored)) {
    return stored;
  }
  return DEFAULT_LANGUAGE; // Hebrew
};

// Helper function to check if language is RTL
export const isRTL = (language: SupportedLanguage): boolean => {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === language)?.rtl || false;
};

// Helper function to get language info
export const getLanguageInfo = (code: SupportedLanguage): Language => {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code) || SUPPORTED_LANGUAGES[0];
};