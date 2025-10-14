import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

type Language = 'en' | 'ar';

interface LocalizationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export const LocalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [translations, setTranslations] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    // Fetch translation files instead of importing them directly
    // to avoid browser module resolution issues with JSON files.
    const loadTranslations = async () => {
      try {
        const enResponse = await fetch('/locales/en.json');
        const arResponse = await fetch('/locales/ar.json');
        if (!enResponse.ok || !arResponse.ok) {
            throw new Error('Failed to fetch translation files');
        }
        const en = await enResponse.json();
        const ar = await arResponse.json();
        setTranslations({ en, ar });
      } catch (e) {
        console.error("Could not load translations:", e);
      }
    };
    loadTranslations();
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    const body = document.querySelector('body');
    if (body) {
        if (language === 'ar') {
            body.style.fontFamily = "'Tajawal', sans-serif";
        } else {
            body.style.fontFamily = "sans-serif"; // Or your preferred English font
        }
    }
  }, [language]);

  const t = useCallback((key: string): string => {
    if (!translations) {
      return key;
    }
    return translations[language]?.[key] || key;
  }, [language, translations]);

  // Render children only after translations have been loaded.
  if (!translations) {
    return null;
  }

  return (
    <LocalizationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};
