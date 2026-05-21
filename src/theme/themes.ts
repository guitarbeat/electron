/**
 * Canonical app themes — single source for CSS variables, shell chrome, and moiré accents.
 * SCSS should consume these via `applyTheme()`; avoid duplicating palette hex in stylesheets.
 */

export type ThemeName = 'movies' | 'places';

export interface AppThemeDefinition {
  name: ThemeName;
  label: string;
  /** Semantic colors for inline React styles (useThemeColors). */
  semantic: {
    accent: string;
    accentHover: string;
    accentMuted: string;
    accentLight: string;
    secondary: string;
    secondaryHover: string;
    secondaryMuted: string;
    tertiary: string;
    tertiaryHover: string;
    background: string;
    surface: string;
    surfaceElevated: string;
    surface0: string;
    surface1: string;
    surface2: string;
    surface3: string;
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    border: string;
    borderSubtle: string;
    success: string;
    warning: string;
    error: string;
    overlay: string;
  };
  /** Moiré / effects bridge */
  moire: {
    color1: string;
    color2: string;
    accent: string;
  };
  /** Tokens passed to ThemeContext (effects, gradients). */
  tokens: {
    accent: string;
    accentHover: string;
    accentLight: string;
    secondary: string;
    tertiary: string;
    background: string;
    surface0: string;
    surface1: string;
    surface2: string;
    surface3: string;
    gradientCard: string;
    glow: string;
    glowStrong: string;
  };
  shell: {
    canvasGap: string;
    canvasPaddingBlock: string;
    stackGap: string;
    stackPaddingTop: string;
    stackPaddingBottom: string;
    panelBorderStrong: string;
    panelBorderSoft: string;
    panelHighlight: string;
    panelGlass: string;
    panelShadow: string;
    panelShadowSoft: string;
    headerSurface: string;
    panelSurface: string;
  };
  /** Custom properties applied to :root when this theme is active. */
  cssVars: Record<string, string>;
}

const sharedStatus = {
  success: '#8ca26d',
  warning: '#d1a15c',
  error: '#bb705f',
  overlay: 'rgba(18, 11, 7, 0.78)',
} as const;

const moviesSemantic = {
  accent: '#c88d59',
  accentHover: '#d9a170',
  accentMuted: '#c88d5940',
  accentLight: '#efd2af',
  secondary: '#8e9f82',
  secondaryHover: '#a3b497',
  secondaryMuted: '#8e9f8240',
  tertiary: '#9a6554',
  tertiaryHover: '#af7b68',
  background: '#1d140e',
  surface: 'rgba(73, 51, 32, 0.72)',
  surfaceElevated: 'rgba(92, 64, 40, 0.84)',
  surface0: '#130d08',
  surface1: 'rgba(69, 48, 29, 0.78)',
  surface2: 'rgba(90, 63, 39, 0.9)',
  surface3: 'rgba(113, 81, 52, 0.95)',
  textPrimary: '#f7efdf',
  textSecondary: '#e0d2b6',
  textTertiary: '#b9a489',
  border: 'rgba(180, 142, 92, 0.42)',
  borderSubtle: 'rgba(190, 152, 98, 0.18)',
  ...sharedStatus,
} as const;

const placesSemantic = {
  accent: '#b87248',
  accentHover: '#cb8861',
  accentMuted: '#b8724840',
  accentLight: '#ebc3a6',
  secondary: '#98a06a',
  secondaryHover: '#acb47a',
  secondaryMuted: '#98a06a40',
  tertiary: '#6f8f8e',
  tertiaryHover: '#86a5a3',
  background: '#1c140d',
  surface: 'rgba(70, 50, 31, 0.72)',
  surfaceElevated: 'rgba(90, 64, 39, 0.84)',
  surface0: '#120d08',
  surface1: 'rgba(67, 48, 29, 0.78)',
  surface2: 'rgba(87, 63, 38, 0.9)',
  surface3: 'rgba(109, 79, 50, 0.95)',
  textPrimary: '#f7efdf',
  textSecondary: '#dfd1b4',
  textTertiary: '#baa789',
  border: 'rgba(177, 141, 88, 0.42)',
  borderSubtle: 'rgba(186, 150, 96, 0.18)',
  ...sharedStatus,
} as const;

const buildCssVars = (
  semantic: typeof moviesSemantic | typeof placesSemantic,
  extras: {
    quaternary: string;
    quinary: string;
    glowPrimary: string;
    glowStrong: string;
    gradientPrimary: string;
    gradientCard: string;
    gradientShell: string;
    gradientMetalBg: string;
    gradientMetalSurface: string;
    gradientMetalPill: string;
    y2kGlintA: string;
    y2kGlintB: string;
    moire1: string;
    moire2: string;
    moireAccent: string;
    waxAccent?: string;
    shellBorder: string;
    headerSurface: string;
    panelSurface: string;
  }
): Record<string, string> => ({
  '--color-accent': semantic.accent,
  '--color-accent-hover': semantic.accentHover,
  '--color-accent-muted': semantic.accentMuted,
  '--color-accent-light': semantic.accentLight,
  '--color-secondary': semantic.secondary,
  '--color-secondary-hover': semantic.secondaryHover,
  '--color-secondary-muted': semantic.secondaryMuted,
  '--color-tertiary': semantic.tertiary,
  '--color-tertiary-hover': semantic.tertiaryHover,
  '--color-quaternary': extras.quaternary,
  '--color-quinary': extras.quinary,
  '--color-background': semantic.background,
  '--color-surface': semantic.surface,
  '--color-surface-elevated': semantic.surfaceElevated,
  '--color-surface-0': semantic.surface0,
  '--color-surface-1': semantic.surface1,
  '--color-surface-2': semantic.surface2,
  '--color-surface-3': semantic.surface3,
  '--color-text-primary': semantic.textPrimary,
  '--color-text-secondary': semantic.textSecondary,
  '--color-text-tertiary': semantic.textTertiary,
  '--color-border': semantic.border,
  '--color-border-subtle': semantic.borderSubtle,
  '--color-success': semantic.success,
  '--color-warning': semantic.warning,
  '--color-error': semantic.error,
  '--color-overlay': semantic.overlay,
  '--glow-primary': extras.glowPrimary,
  '--glow-strong': extras.glowStrong,
  '--gradient-primary': extras.gradientPrimary,
  '--gradient-card': extras.gradientCard,
  '--gradient-shell': extras.gradientShell,
  '--gradient-metal-bg': extras.gradientMetalBg,
  '--gradient-metal-surface': extras.gradientMetalSurface,
  '--gradient-metal-pill': extras.gradientMetalPill,
  '--y2k-metal-glint-a': extras.y2kGlintA,
  '--y2k-metal-glint-b': extras.y2kGlintB,
  '--moire-color-1': extras.moire1,
  '--moire-color-2': extras.moire2,
  '--moire-accent': extras.moireAccent,
  '--shell-border': extras.shellBorder,
  '--shell-header-surface': extras.headerSurface,
  '--shell-panel-surface': extras.panelSurface,
  ...(extras.waxAccent ? { '--wax-accent': extras.waxAccent } : {}),
});

export const moviesThemeDefinition: AppThemeDefinition = {
  name: 'movies',
  label: 'Movies',
  semantic: moviesSemantic,
  moire: {
    color1: '#d9a170',
    color2: '#8e9f82',
    accent: '#c88d59',
  },
  tokens: {
    accent: moviesSemantic.accent,
    accentHover: moviesSemantic.accentHover,
    accentLight: moviesSemantic.accentLight,
    secondary: moviesSemantic.secondary,
    tertiary: moviesSemantic.tertiary,
    background: moviesSemantic.background,
    surface0: moviesSemantic.surface0,
    surface1: moviesSemantic.surface1,
    surface2: moviesSemantic.surface2,
    surface3: moviesSemantic.surface3,
    gradientCard:
      'linear-gradient(180deg, rgba(102, 75, 49, 0.96) 0%, rgba(58, 39, 24, 0.92) 100%)',
    glow: '0 0 16px rgba(200, 141, 89, 0.22), 0 0 32px rgba(142, 159, 130, 0.12)',
    glowStrong: '0 0 24px rgba(200, 141, 89, 0.34), 0 0 40px rgba(212, 177, 115, 0.16)',
  },
  shell: {
    canvasGap: 'clamp(0.7rem, 0.38rem + 0.8vw, 1.15rem)',
    canvasPaddingBlock: 'clamp(0.3rem, 0.18rem + 0.4vw, 0.7rem)',
    stackGap: 'clamp(0.85rem, 0.68rem + 0.55vw, 1.3rem)',
    stackPaddingTop: 'clamp(0.55rem, 0.42rem + 0.55vw, 0.95rem)',
    stackPaddingBottom: 'clamp(0.8rem, 0.6rem + 0.8vw, 1.35rem)',
    panelBorderStrong: 'rgba(255, 236, 206, 0.22)',
    panelBorderSoft: 'rgba(255, 236, 206, 0.12)',
    panelHighlight: 'rgba(255, 255, 255, 0.08)',
    panelGlass: 'rgba(255, 255, 255, 0.04)',
    panelShadow: '0 24px 56px rgba(0, 0, 0, 0.24)',
    panelShadowSoft: '0 14px 28px rgba(0, 0, 0, 0.16)',
    headerSurface:
      'linear-gradient(155deg, rgba(58, 42, 28, 0.92) 0%, rgba(24, 16, 11, 0.96) 100%)',
    panelSurface:
      'linear-gradient(160deg, rgba(62, 44, 28, 0.9) 0%, rgba(28, 19, 13, 0.94) 100%)',
  },
  cssVars: buildCssVars(moviesSemantic, {
    quaternary: '#8ea6a7',
    quinary: '#d4b173',
    glowPrimary: '0 0 16px rgba(200, 141, 89, 0.22), 0 0 32px rgba(142, 159, 130, 0.12)',
    glowStrong: '0 0 24px rgba(200, 141, 89, 0.34), 0 0 40px rgba(212, 177, 115, 0.16)',
    gradientPrimary: 'linear-gradient(135deg, #c88d59 0%, #d4b173 100%)',
    gradientCard:
      'linear-gradient(180deg, rgba(102, 75, 49, 0.96) 0%, rgba(58, 39, 24, 0.92) 100%)',
    gradientShell: 'linear-gradient(180deg, #2a1c12 0%, #1b120c 52%, #110c08 100%)',
    gradientMetalBg: 'linear-gradient(180deg, #2a1c12 0%, #1b120c 52%, #110c08 100%)',
    gradientMetalSurface: 'linear-gradient(180deg, #f8edd8 0%, #d8c19d 46%, #9d7e56 100%)',
    gradientMetalPill: 'linear-gradient(180deg, #fbf2df 0%, #ead4ae 42%, #b88f5d 100%)',
    y2kGlintA: 'rgba(255, 234, 201, 0.22)',
    y2kGlintB: 'rgba(211, 177, 119, 0.16)',
    moire1: '#d9a170',
    moire2: '#8e9f82',
    moireAccent: '#c88d59',
    waxAccent: '#7d4132',
    shellBorder: 'rgba(177, 141, 88, 0.26)',
    headerSurface:
      'linear-gradient(155deg, rgba(58, 42, 28, 0.92) 0%, rgba(24, 16, 11, 0.96) 100%)',
    panelSurface:
      'linear-gradient(160deg, rgba(62, 44, 28, 0.9) 0%, rgba(28, 19, 13, 0.94) 100%)',
  }),
};

export const placesThemeDefinition: AppThemeDefinition = {
  name: 'places',
  label: 'Places',
  semantic: placesSemantic,
  moire: {
    color1: '#cb8861',
    color2: '#98a06a',
    accent: '#b87248',
  },
  tokens: {
    accent: placesSemantic.accent,
    accentHover: placesSemantic.accentHover,
    accentLight: placesSemantic.accentLight,
    secondary: placesSemantic.secondary,
    tertiary: placesSemantic.tertiary,
    background: placesSemantic.background,
    surface0: placesSemantic.surface0,
    surface1: placesSemantic.surface1,
    surface2: placesSemantic.surface2,
    surface3: placesSemantic.surface3,
    gradientCard:
      'linear-gradient(180deg, rgba(100, 74, 47, 0.96) 0%, rgba(57, 40, 24, 0.92) 100%)',
    glow: '0 0 16px rgba(184, 114, 72, 0.2), 0 0 32px rgba(152, 160, 106, 0.12)',
    glowStrong: '0 0 24px rgba(184, 114, 72, 0.3), 0 0 40px rgba(135, 164, 160, 0.16)',
  },
  shell: {
    canvasGap: 'clamp(0.7rem, 0.38rem + 0.8vw, 1.15rem)',
    canvasPaddingBlock: 'clamp(0.3rem, 0.18rem + 0.4vw, 0.7rem)',
    stackGap: 'clamp(0.85rem, 0.68rem + 0.55vw, 1.3rem)',
    stackPaddingTop: 'clamp(0.55rem, 0.42rem + 0.55vw, 0.95rem)',
    stackPaddingBottom: 'clamp(0.8rem, 0.6rem + 0.8vw, 1.35rem)',
    panelBorderStrong: 'rgba(255, 236, 206, 0.2)',
    panelBorderSoft: 'rgba(255, 236, 206, 0.1)',
    panelHighlight: 'rgba(255, 255, 255, 0.07)',
    panelGlass: 'rgba(255, 255, 255, 0.035)',
    panelShadow: '0 24px 56px rgba(0, 0, 0, 0.24)',
    panelShadowSoft: '0 14px 28px rgba(0, 0, 0, 0.16)',
    headerSurface:
      'linear-gradient(155deg, rgba(52, 38, 28, 0.92) 0%, rgba(22, 15, 10, 0.96) 100%)',
    panelSurface:
      'linear-gradient(160deg, rgba(58, 42, 30, 0.9) 0%, rgba(26, 18, 12, 0.94) 100%)',
  },
  cssVars: buildCssVars(placesSemantic, {
    quaternary: '#87a4a0',
    quinary: '#cda55d',
    glowPrimary: '0 0 16px rgba(184, 114, 72, 0.2), 0 0 32px rgba(152, 160, 106, 0.12)',
    glowStrong: '0 0 24px rgba(184, 114, 72, 0.3), 0 0 40px rgba(135, 164, 160, 0.16)',
    gradientPrimary: 'linear-gradient(135deg, #b87248 0%, #98a06a 100%)',
    gradientCard:
      'linear-gradient(180deg, rgba(100, 74, 47, 0.96) 0%, rgba(57, 40, 24, 0.92) 100%)',
    gradientShell: 'linear-gradient(180deg, #281c12 0%, #1a130c 52%, #110c08 100%)',
    gradientMetalBg: 'linear-gradient(180deg, #281c12 0%, #1a130c 52%, #110c08 100%)',
    gradientMetalSurface: 'linear-gradient(180deg, #f7edd8 0%, #d7c198 46%, #9f8053 100%)',
    gradientMetalPill: 'linear-gradient(180deg, #fbf2df 0%, #e8d4ad 42%, #b68b58 100%)',
    y2kGlintA: 'rgba(255, 233, 198, 0.22)',
    y2kGlintB: 'rgba(201, 176, 130, 0.18)',
    moire1: '#cb8861',
    moire2: '#98a06a',
    moireAccent: '#b87248',
    shellBorder: 'rgba(177, 141, 88, 0.24)',
    headerSurface:
      'linear-gradient(155deg, rgba(52, 38, 28, 0.92) 0%, rgba(22, 15, 10, 0.96) 100%)',
    panelSurface:
      'linear-gradient(160deg, rgba(58, 42, 30, 0.9) 0%, rgba(26, 18, 12, 0.94) 100%)',
  }),
};

export const appThemes: Record<ThemeName, AppThemeDefinition> = {
  movies: moviesThemeDefinition,
  places: placesThemeDefinition,
};

export const getAppTheme = (name: ThemeName): AppThemeDefinition => appThemes[name];
