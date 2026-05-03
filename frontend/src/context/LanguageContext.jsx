import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { translations } from '../locales';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  // Try to load from localStorage first, default to 'fr'
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('app_language');
    return saved && translations[saved] ? saved : 'fr';
  });

  useEffect(() => {
    localStorage.setItem('app_language', language);
    // Add class to body for potential CSS language-based tweaks
    document.body.className = `lang-${language}`;
  }, [language]);

  const changeLanguage = useCallback((lang) => {
    if (translations[lang]) setLanguage(lang);
  }, []);

  const t = useCallback((key) => {
    return translations[language][key] || key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
