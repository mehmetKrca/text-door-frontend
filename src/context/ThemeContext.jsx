import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'ewindoore_tema';

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(() => {
    const kayitliTema = localStorage.getItem(STORAGE_KEY);
    return kayitliTema === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema);
    localStorage.setItem(STORAGE_KEY, tema);
  }, [tema]);

  const temaDegistir = () => {
    setTema((onceki) => (onceki === 'light' ? 'dark' : 'light'));
  };

  const value = { tema, setTema, temaDegistir };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme, bir ThemeProvider icinde kullanilmalidir');
  }
  return context;
}
