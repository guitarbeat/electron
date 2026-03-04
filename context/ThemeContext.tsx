import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { MainTab } from '../types';

// Theme-specific color tokens
export const moviesTheme = {
  // Primary accent (Hot Pink - cinematic, vibrant)
  accent: '#ff7fc6',
  accentHover: '#ff9bd3',
  accentMuted: '#ff7fc640',
  accentLight: '#ffc2e6',
  
  // Secondary accent (Light Sky Blue)
  secondary: '#95dcff',
  secondaryHover: '#b3e8ff',
  secondaryMuted: '#95dcff40',
  
  // Tertiary (Medium Purple)
  tertiary: '#a78af2',
  tertiaryHover: '#c0a8ff',
  
  // Background (Dark slate)
  background: '#020617',
  surface: 'rgba(15, 23, 42, 0.65)',
  surfaceElevated: 'rgba(30, 41, 59, 0.8)',
  surface0: '#0a0f1e',
  surface1: 'rgba(15, 23, 42, 0.7)',
  surface2: 'rgba(30, 41, 59, 0.85)',
  surface3: 'rgba(51, 65, 85, 0.92)',
  
  // Glow effects (Pink-tinted)
  glow: '0 0 15px rgba(255, 127, 198, 0.4), 0 0 30px rgba(255, 127, 198, 0.15)',
  glowStrong: '0 0 20px rgba(255, 127, 198, 0.6), 0 0 40px rgba(255, 127, 198, 0.25)',
  textGlow: '0 1px 2px rgba(0, 0, 0, 0.5), 0 0 8px rgba(255, 127, 198, 0.35)',
  
  // Gradients
  gradientPrimary: 'linear-gradient(135deg, #ff7fc6 0%, #ff9bd3 100%)',
  gradientCard: 'linear-gradient(180deg, rgba(44, 63, 104, 0.95) 0%, rgba(36, 53, 90, 0.88) 100%)',
  textGradient: 'linear-gradient(135deg, #ff7fc6 0%, #ff9bd3 50%, #fff 100%)',
} as const;

export const placesTheme = {
  // Primary accent (Golden yellow - warm, geographical)
  accent: '#fff06a',
  accentHover: '#fff8bf',
  accentMuted: '#fff06a40',
  accentLight: '#fff8cc',
  
  // Secondary accent (Sage green - natural, earthy)
  secondary: '#90ee90',
  secondaryHover: '#a8f5a8',
  secondaryMuted: '#90ee9040',
  
  // Tertiary (Warm orange)
  tertiary: '#ffb347',
  tertiaryHover: '#ffc266',
  
  // Background (Slightly warmer dark)
  background: '#0a0f1a',
  surface: 'rgba(20, 25, 40, 0.65)',
  surfaceElevated: 'rgba(35, 45, 60, 0.8)',
  surface0: '#0f1419',
  surface1: 'rgba(20, 25, 40, 0.7)',
  surface2: 'rgba(35, 45, 60, 0.85)',
  surface3: 'rgba(55, 65, 75, 0.92)',
  
  // Glow effects (Yellow/green-tinted)
  glow: '0 0 15px rgba(255, 240, 106, 0.4), 0 0 30px rgba(144, 238, 144, 0.15)',
  glowStrong: '0 0 20px rgba(255, 240, 106, 0.6), 0 0 40px rgba(144, 238, 144, 0.25)',
  textGlow: '0 1px 2px rgba(0, 0, 0, 0.5), 0 0 8px rgba(255, 240, 106, 0.35)',
  
  // Gradients
  gradientPrimary: 'linear-gradient(135deg, #fff06a 0%, #90ee90 100%)',
  gradientCard: 'linear-gradient(180deg, rgba(45, 55, 70, 0.95) 0%, rgba(35, 45, 60, 0.88) 100%)',
  textGradient: 'linear-gradient(135deg, #fff06a 0%, #90ee90 50%, #fff 100%)',
} as const;

interface ThemeContextValue {
  currentTheme: 'movies' | 'places';
  themeTokens: typeof moviesTheme | typeof placesTheme;
  setTheme: (theme: 'movies' | 'places') => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: ReactNode; activeTab: MainTab }> = ({ 
  children, 
  activeTab 
}) => {
  const currentTheme: 'movies' | 'places' = activeTab === 'places' ? 'places' : 'movies';
  const themeTokens = currentTheme === 'places' ? placesTheme : moviesTheme;

  const setTheme = (theme: 'movies' | 'places') => {
    // This would be used if we want manual theme switching
    // For now, theme is determined by activeTab
    console.log(`Theme set to: ${theme}`);
  };

  const value = useMemo(() => ({
    currentTheme,
    themeTokens,
    setTheme,
  }), [currentTheme, themeTokens]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
