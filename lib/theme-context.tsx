import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { darkTheme, lightTheme, Theme } from './theme';

const STORAGE_KEY = 'vanaris.themeMode';

type ThemeState = { theme: Theme; mode: 'dark' | 'light'; toggle: () => void };

const ThemeContext = createContext<ThemeState | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark') setMode(saved);
    });
  }, []);

  const toggle = () => {
    setMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme: mode === 'dark' ? darkTheme : lightTheme, mode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
