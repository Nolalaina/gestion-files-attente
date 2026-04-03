import { useState, useEffect } from 'react';

const useTheme = () => {
  const [theme, setTheme] = useState('light');
  const [systemTheme, setSystemTheme] = useState('light');

  // Détecter le thème système
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      const newTheme = e.matches ? 'dark' : 'light';
      setSystemTheme(newTheme);
      if (localStorage.getItem('theme') === null) {
        applyTheme(newTheme);
      }
    };

    // Listener pour changements système
    mediaQuery.addEventListener('change', handleChange);

    // Initialiser le thème
    const savedTheme = localStorage.getItem('theme');
    const initialTheme = savedTheme || (mediaQuery.matches ? 'dark' : 'light');
    
    setTheme(initialTheme);
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    applyTheme(initialTheme);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const applyTheme = (newTheme) => {
    const htmlElement = document.documentElement;
    htmlElement.setAttribute('data-theme', newTheme);
    document.body.setAttribute('data-theme', newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  const setThemeMode = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  return {
    theme,
    toggleTheme,
    setThemeMode,
    systemTheme,
  };
};

export default useTheme;
