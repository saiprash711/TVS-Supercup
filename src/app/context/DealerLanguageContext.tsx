'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { dealerTranslations, formatTranslation, Language } from '../../lib/translations/dealerTranslations';

interface DealerLanguageContextValue {
  language: Language;
  isTamil: boolean;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, defaultEn?: string, params?: Record<string, string | number>) => string;
}

const DealerLanguageContext = createContext<DealerLanguageContextValue | null>(null);

const STORAGE_KEY = 'supercup_dealer_lang';

export function DealerLanguageProvider({ children }: { children: React.ReactNode }) {
  // Always default to English as per specification
  const [language, setLanguageState] = useState<Language>('en');

  // Load from localStorage if dealer previously chose a language
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'ta' || saved === 'en') {
        setLanguageState(saved as Language);
      }
    } catch {}
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {}
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => {
      const next: Language = prev === 'en' ? 'ta' : 'en';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {}
      return next;
    });
  }, []);

  const t = useCallback(
    (key: string, defaultEn?: string, params?: Record<string, string | number>): string => {
      const item = dealerTranslations[key];
      let str = '';
      if (item) {
        str = language === 'ta' ? item.ta : item.en;
      } else {
        str = defaultEn || key;
      }
      return formatTranslation(str, params);
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      isTamil: language === 'ta',
      setLanguage,
      toggleLanguage,
      t,
    }),
    [language, setLanguage, toggleLanguage, t]
  );

  return (
    <DealerLanguageContext.Provider value={value}>
      {children}
    </DealerLanguageContext.Provider>
  );
}

export function useDealerLanguage() {
  const ctx = useContext(DealerLanguageContext);
  if (!ctx) {
    // Fallback safe defaults if used outside provider
    return {
      language: 'en' as Language,
      isTamil: false,
      setLanguage: () => {},
      toggleLanguage: () => {},
      t: (key: string, defaultEn?: string, params?: Record<string, string | number>) =>
        formatTranslation(dealerTranslations[key]?.en || defaultEn || key, params),
    };
  }
  return ctx;
}
