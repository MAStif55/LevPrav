'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import ruDict from '@/locales/ru.json';
import enDict from '@/locales/en.json';

type Locale = 'ru' | 'en';

type Dictionary = typeof ruDict;

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  dictionary: Dictionary;
}

const dictionaries: Record<Locale, Dictionary> = {
  ru: ruDict,
  en: enDict,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
  defaultLocale?: Locale;
}

export function LanguageProvider({ children, defaultLocale = 'ru' }: LanguageProviderProps) {
  const [locale, setLocale] = useState<Locale>(defaultLocale);

  const dictionary = dictionaries[locale];

  // Helper function to get nested value from dictionary using dot notation
  const t = useCallback((key: string): string => {
    const keys = key.split('.');
    let value: unknown = dictionary;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    return typeof value === 'string' ? value : key;
  }, [dictionary]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, dictionary }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Alias for convenience
export const useTranslation = useLanguage;
