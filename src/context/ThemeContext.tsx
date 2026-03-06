import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import type { MainTab } from '@/types.ts';
import { moviesTheme, placesTheme } from './themeTokens.ts';

export { moviesTheme, placesTheme };

interface ThemeContextValue {
  currentTheme: 'movies' | 'places';
  themeTokens: typeof moviesTheme | typeof placesTheme;
  setTheme: (theme: 'movies' | 'places') => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: ReactNode; activeTab: MainTab }> = ({
  children,
  activeTab,
}) => {
  const currentTheme: 'movies' | 'places' = activeTab === 'places' ? 'places' : 'movies';
  const themeTokens = currentTheme === 'places' ? placesTheme : moviesTheme;

  const setTheme = (theme: 'movies' | 'places') => {
    // This would be used if we want manual theme switching
    // For now, theme is determined by activeTab
    console.log(`Theme set to: ${theme}`);
  };

  const value = useMemo(
    () => ({
      currentTheme,
      themeTokens,
      setTheme,
    }),
    [currentTheme, themeTokens]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
