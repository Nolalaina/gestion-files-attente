import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from '../locales';

interface LanguageContextType {
  language: string;
  changeLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<string>('fr');

  useEffect(() => {
    const loadLang = async () => {
      try {
        const saved = await AsyncStorage.getItem('app_language');
        if (saved && translations[saved]) {
          setLanguage(saved);
        }
      } catch (e) {
        // Ignorer l'erreur
      }
    };
    loadLang();
  }, []);

  const changeLanguage = useCallback(async (lang: string) => {
    if (translations[lang]) {
      setLanguage(lang);
      await AsyncStorage.setItem('app_language', lang);
    }
  }, []);

  const t = useCallback((key: string) => {
    return translations[language][key] || key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
