import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { LANGUAGES, translate, translations } from '../i18n';

const LANGUAGE_STORAGE_KEY = 'migraineguardian_language';

const I18nContext = createContext({
  language: 'en',
  setLanguage: () => {},
  t: () => '',
  languages: LANGUAGES,
});

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved && (saved === 'en' || saved === 'hi' || saved === 'mr')) {
        return saved;
      }
    } catch (e) {
      console.warn('[I18n] Could not read from localStorage:', e);
    }
    return 'en';
  });

  const setLanguage = useCallback((newLang) => {
    if (newLang === 'en' || newLang === 'hi' || newLang === 'mr') {
      setLanguageState(newLang);
      try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
      } catch (e) {
        console.warn('[I18n] Could not write to localStorage:', e);
      }
      // Set document language attribute for accessibility
      document.documentElement.lang = newLang;
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = useCallback(
    (key, params) => {
      return translate(language, key, params);
    },
    [language]
  );

  const value = {
    language,
    currentLanguage: language,
    setLanguage,
    t,
    languages: LANGUAGES,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}

export const useI18n = useTranslation;

export default I18nContext;
