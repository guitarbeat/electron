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
  success: '#8f9f78',
  warning: '#c9a56a',
  error: '#b87a68',
  overlay: 'rgba(22, 16, 12, 0.82)',
} as const;

/** Movies — candlelit living room: honey wood, worn linen, sage smoke. */
const moviesSemantic = {
  accent: '#c49a6e',
  accentHover: '#d4ad82',
  accentMuted: '#c49a6e42',
  accentLight: '#edd9c2',
  secondary: '#84977f',
  secondaryHover: '#97a892',
  secondaryMuted: '#84977f40',
  tertiary: '#9d7560',
  tertiaryHover: '#b08972',
  background: '#181410',
  surface: 'rgba(78, 58, 42, 0.76)',
  surfaceElevated: 'rgba(96, 72, 54, 0.86)',
  surface0: '#14100d',
  surface1: 'rgba(72, 54, 40, 0.82)',
  surface2: 'rgba(92, 68, 50, 0.9)',
  surface3: 'rgba(112, 84, 62, 0.94)',
  textPrimary: '#f2e8d8',
  textSecondary: '#cfc0a8',
  textTertiary: '#9f8b72',
  border: 'rgba(196, 168, 132, 0.38)',
  borderSubtle: 'rgba(196, 168, 132, 0.16)',
  ...sharedStatus,
} as const;

/** Places — sun-warmed journal: clay, dried herbs, soft river stone. */
const placesSemantic = {
  accent: '#b88462',
  accentHover: '#ca9a76',
  accentMuted: '#b8846240',
  accentLight: '#e8cdb5',
  secondary: '#8d9872',
  secondaryHover: '#a0ab84',
  secondaryMuted: '#8d987240',
  tertiary: '#749089',
  tertiaryHover: '#89a39c',
  background: '#171410',
  surface: 'rgba(74, 58, 44, 0.76)',
  surfaceElevated: 'rgba(94, 74, 58, 0.86)',
  surface0: '#12100d',
  surface1: 'rgba(70, 56, 42, 0.82)',
  surface2: 'rgba(90, 72, 56, 0.9)',
  surface3: 'rgba(108, 88, 70, 0.94)',
  textPrimary: '#f0e6d6',
  textSecondary: '#ccc0a8',
  textTertiary: '#9a8c74',
  border: 'rgba(188, 158, 120, 0.36)',
  borderSubtle: 'rgba(188, 158, 120, 0.15)',
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
  '--texture-paper-surface': extras.panelSurface,
  '--texture-grain-strength': '0.055',
  '--texture-fiber-strength': '0.045',
  '--texture-vignette-strength': '0.42',
  '--chrome-surface': extras.panelSurface,
  ...(extras.waxAccent ? { '--wax-accent': extras.waxAccent } : {}),
});

export const moviesThemeDefinition: AppThemeDefinition = {
  name: 'movies',
  label: 'Movies',
  semantic: moviesSemantic,
  moire: {
    color1: '#d4ad82',
    color2: '#84977f',
    accent: '#c49a6e',
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
      'linear-gradient(178deg, rgba(98, 72, 52, 0.94) 0%, rgba(52, 38, 28, 0.9) 52%, rgba(32, 24, 18, 0.92) 100%)',
    glow: '0 0 20px rgba(196, 154, 110, 0.14), 0 0 36px rgba(132, 151, 127, 0.08)',
    glowStrong: '0 0 28px rgba(196, 154, 110, 0.22), 0 0 48px rgba(237, 217, 194, 0.1)',
  },
  shell: {
    canvasGap: 'clamp(0.7rem, 0.38rem + 0.8vw, 1.15rem)',
    canvasPaddingBlock: 'clamp(0.3rem, 0.18rem + 0.4vw, 0.7rem)',
    stackGap: 'clamp(0.85rem, 0.68rem + 0.55vw, 1.3rem)',
    stackPaddingTop: 'clamp(0.55rem, 0.42rem + 0.55vw, 0.95rem)',
    stackPaddingBottom: 'clamp(0.8rem, 0.6rem + 0.8vw, 1.35rem)',
    panelBorderStrong: 'rgba(237, 220, 196, 0.2)',
    panelBorderSoft: 'rgba(237, 220, 196, 0.1)',
    panelHighlight: 'rgba(255, 248, 238, 0.1)',
    panelGlass: 'rgba(255, 248, 238, 0.035)',
    panelShadow: '0 22px 48px rgba(18, 12, 8, 0.28)',
    panelShadowSoft: '0 12px 26px rgba(18, 12, 8, 0.18)',
    headerSurface:
      'linear-gradient(155deg, rgba(88, 64, 46, 0.94) 0%, rgba(42, 30, 22, 0.97) 58%, rgba(24, 18, 14, 0.98) 100%)',
    panelSurface:
      'linear-gradient(165deg, rgba(82, 60, 44, 0.92) 0%, rgba(48, 34, 24, 0.95) 45%, rgba(26, 20, 15, 0.97) 100%)',
  },
  cssVars: buildCssVars(moviesSemantic, {
    quaternary: '#a8a498',
    quinary: '#c9a56a',
    glowPrimary: '0 0 20px rgba(196, 154, 110, 0.14), 0 0 36px rgba(132, 151, 127, 0.08)',
    glowStrong: '0 0 28px rgba(196, 154, 110, 0.22), 0 0 48px rgba(237, 217, 194, 0.1)',
    gradientPrimary: 'linear-gradient(128deg, #c49a6e 0%, #d4ad82 42%, #edd9c2 100%)',
    gradientCard:
      'linear-gradient(178deg, rgba(98, 72, 52, 0.94) 0%, rgba(52, 38, 28, 0.9) 52%, rgba(32, 24, 18, 0.92) 100%)',
    gradientShell:
      'linear-gradient(182deg, #2a2018 0%, #1c1510 42%, #12100d 72%, #0f0c09 100%)',
    gradientMetalBg:
      'linear-gradient(182deg, #2a2018 0%, #1c1510 42%, #12100d 72%, #0f0c09 100%)',
    gradientMetalSurface:
      'linear-gradient(180deg, #f6ebdc 0%, #dcc5a8 38%, #a88462 72%, #6e523c 100%)',
    gradientMetalPill:
      'linear-gradient(180deg, #faf3e8 0%, #e8d4b6 38%, #c49a6e 100%)',
    y2kGlintA: 'rgba(255, 236, 214, 0.2)',
    y2kGlintB: 'rgba(212, 173, 130, 0.14)',
    moire1: '#d4ad82',
    moire2: '#84977f',
    moireAccent: '#c49a6e',
    waxAccent: '#8a5c48',
    shellBorder: 'rgba(196, 168, 132, 0.22)',
    headerSurface:
      'linear-gradient(155deg, rgba(88, 64, 46, 0.94) 0%, rgba(42, 30, 22, 0.97) 58%, rgba(24, 18, 14, 0.98) 100%)',
    panelSurface:
      'linear-gradient(165deg, rgba(82, 60, 44, 0.92) 0%, rgba(48, 34, 24, 0.95) 45%, rgba(26, 20, 15, 0.97) 100%)',
  }),
};

export const placesThemeDefinition: AppThemeDefinition = {
  name: 'places',
  label: 'Places',
  semantic: placesSemantic,
  moire: {
    color1: '#ca9a76',
    color2: '#8d9872',
    accent: '#b88462',
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
      'linear-gradient(178deg, rgba(96, 74, 56, 0.94) 0%, rgba(54, 42, 32, 0.9) 52%, rgba(30, 24, 18, 0.92) 100%)',
    glow: '0 0 20px rgba(184, 132, 98, 0.14), 0 0 36px rgba(141, 152, 114, 0.08)',
    glowStrong: '0 0 28px rgba(184, 132, 98, 0.2), 0 0 48px rgba(232, 205, 181, 0.1)',
  },
  shell: {
    canvasGap: 'clamp(0.7rem, 0.38rem + 0.8vw, 1.15rem)',
    canvasPaddingBlock: 'clamp(0.3rem, 0.18rem + 0.4vw, 0.7rem)',
    stackGap: 'clamp(0.85rem, 0.68rem + 0.55vw, 1.3rem)',
    stackPaddingTop: 'clamp(0.55rem, 0.42rem + 0.55vw, 0.95rem)',
    stackPaddingBottom: 'clamp(0.8rem, 0.6rem + 0.8vw, 1.35rem)',
    panelBorderStrong: 'rgba(235, 222, 200, 0.18)',
    panelBorderSoft: 'rgba(235, 222, 200, 0.09)',
    panelHighlight: 'rgba(255, 248, 240, 0.09)',
    panelGlass: 'rgba(255, 248, 240, 0.03)',
    panelShadow: '0 22px 48px rgba(16, 12, 9, 0.28)',
    panelShadowSoft: '0 12px 26px rgba(16, 12, 9, 0.18)',
    headerSurface:
      'linear-gradient(155deg, rgba(84, 66, 50, 0.94) 0%, rgba(44, 34, 26, 0.97) 58%, rgba(22, 18, 14, 0.98) 100%)',
    panelSurface:
      'linear-gradient(165deg, rgba(78, 62, 48, 0.92) 0%, rgba(46, 36, 28, 0.95) 45%, rgba(24, 20, 16, 0.97) 100%)',
  },
  cssVars: buildCssVars(placesSemantic, {
    quaternary: '#89a39c',
    quinary: '#c9a56a',
    glowPrimary: '0 0 20px rgba(184, 132, 98, 0.14), 0 0 36px rgba(141, 152, 114, 0.08)',
    glowStrong: '0 0 28px rgba(184, 132, 98, 0.2), 0 0 48px rgba(232, 205, 181, 0.1)',
    gradientPrimary: 'linear-gradient(128deg, #b88462 0%, #ca9a76 40%, #e8cdb5 100%)',
    gradientCard:
      'linear-gradient(178deg, rgba(96, 74, 56, 0.94) 0%, rgba(54, 42, 32, 0.9) 52%, rgba(30, 24, 18, 0.92) 100%)',
    gradientShell:
      'linear-gradient(182deg, #282218 0%, #1a1612 42%, #12100d 72%, #0f0d0a 100%)',
    gradientMetalBg:
      'linear-gradient(182deg, #282218 0%, #1a1612 42%, #12100d 72%, #0f0d0a 100%)',
    gradientMetalSurface:
      'linear-gradient(180deg, #f5ebdc 0%, #d9c4a4 38%, #a88462 72%, #6c5644 100%)',
    gradientMetalPill:
      'linear-gradient(180deg, #faf4ea 0%, #e6d0b4 38%, #b88462 100%)',
    y2kGlintA: 'rgba(255, 234, 210, 0.18)',
    y2kGlintB: 'rgba(202, 168, 128, 0.12)',
    moire1: '#ca9a76',
    moire2: '#8d9872',
    moireAccent: '#b88462',
    shellBorder: 'rgba(188, 158, 120, 0.2)',
    headerSurface:
      'linear-gradient(155deg, rgba(84, 66, 50, 0.94) 0%, rgba(44, 34, 26, 0.97) 58%, rgba(22, 18, 14, 0.98) 100%)',
    panelSurface:
      'linear-gradient(165deg, rgba(78, 62, 48, 0.92) 0%, rgba(46, 36, 28, 0.95) 45%, rgba(24, 20, 16, 0.97) 100%)',
  }),
};

export const appThemes: Record<ThemeName, AppThemeDefinition> = {
  movies: moviesThemeDefinition,
  places: placesThemeDefinition,
};

export const getAppTheme = (name: ThemeName): AppThemeDefinition => appThemes[name];
