/**
 * Language Context - Provides internationalization throughout the app
 * Manages language state, translations, and RTL support
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  SupportedLanguage, 
  TranslationKeys, 
  translations, 
  getInitialLanguage, 
  storeLanguage, 
  isRTL,
  getLanguageInfo
} from '../i18n/index';

interface LanguageContextType {
  language: SupportedLanguage;
  t: TranslationKeys;
  changeLanguage: (newLanguage: SupportedLanguage) => Promise<void>;
  isRTL: boolean;
  availableLanguages: typeof import('../i18n').SUPPORTED_LANGUAGES;
  currentLanguageInfo: ReturnType<typeof getLanguageInfo>;
  isChangingLanguage: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<SupportedLanguage>(getInitialLanguage());
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);

  // Update document direction and lang attribute when language changes
  useEffect(() => {
    const isCurrentRTL = isRTL(language);
    
    // Set document direction
    document.dir = isCurrentRTL ? 'rtl' : 'ltr';
    
    // Set document language
    document.documentElement.lang = language;
    
    // Add RTL class to body for CSS targeting
    if (isCurrentRTL) {
      document.body.classList.add('rtl');
      document.body.classList.remove('ltr');
    } else {
      document.body.classList.add('ltr');
      document.body.classList.remove('rtl');
    }

    // Store the language preference
    storeLanguage(language);
  }, [language]);

  const changeLanguage = async (newLanguage: SupportedLanguage): Promise<void> => {
    if (newLanguage === language) return;

    setIsChangingLanguage(true);
    
    try {
      // Simulate a brief loading time for smooth transition
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setLanguage(newLanguage);
      
      // Show success message in the new language
      const newTranslations = translations[newLanguage];
      
      // You could show a toast notification here
      console.log(newTranslations.settings.language.changeSuccess);
      
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setIsChangingLanguage(false);
    }
  };

  const contextValue: LanguageContextType = {
    language,
    t: translations[language],
    changeLanguage,
    isRTL: isRTL(language),
    availableLanguages: require('../i18n').SUPPORTED_LANGUAGES,
    currentLanguageInfo: getLanguageInfo(language),
    isChangingLanguage
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use the language context
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Helper hook for easy translation access
export const useTranslation = () => {
  const { t, language, isRTL } = useLanguage();
  return { t, language, isRTL };
};

// Helper hook for specific translation paths
export const useT = () => {
  const { t } = useLanguage();
  return t;
};