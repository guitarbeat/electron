import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import type { MainTab } from '@/types.ts';
import { moviesTheme, placesTheme } from '@/design-system/tokens.ts';

interface ThemeContextValue {
  currentTheme: 'movies' | 'places';
  themeTokens: typeof moviesTheme | typeof placesTheme;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: ReactNode; activeTab: MainTab }> = ({
  children,
  activeTab,
}) => {
  const currentTheme: 'movies' | 'places' = activeTab === 'places' ? 'places' : 'movies';
  const themeTokens = currentTheme === 'places' ? placesTheme : moviesTheme;

  const value = useMemo(
    () => ({
      currentTheme,
      themeTokens,
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
