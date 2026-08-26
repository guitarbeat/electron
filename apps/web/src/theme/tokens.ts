/**
 * Design System Tokens & Theme definitions
 * Spacing, typography, motion, radii, shadows, z-indices, theme definitions and applyTheme utility.
 */

// ============================================================================
// Theme Definition & App Themes (originally from themes.ts)
// ============================================================================

export type ThemeName = "movies" | "places";

export interface AppThemeDefinition {
  name: ThemeName;
  label: string;
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
  moire: {
    color1: string;
    color2: string;
    accent: string;
  };
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
  cssVars: Record<string, string>;
}

const sharedStatus = {
  success: "#4ade80",
  warning: "#facc15",
  error: "#f87171",
  overlay: "rgba(3, 7, 18, 0.8)",
} as const;

/** Movies — sleek obsidian dark theme with modern sky blue accents. */
const moviesSemantic = {
  accent: "#38bdf8",
  accentHover: "#7dd3fc",
  accentMuted: "rgba(56, 189, 248, 0.2)",
  accentLight: "#e0f2fe",
  secondary: "#818cf8",
  secondaryHover: "#a5b4fc",
  secondaryMuted: "rgba(129, 140, 248, 0.2)",
  tertiary: "#34d399",
  tertiaryHover: "#6ee7b7",
  background: "#090d16",
  surface: "rgba(15, 23, 42, 0.85)",
  surfaceElevated: "rgba(30, 41, 59, 0.95)",
  surface0: "#090d16",
  surface1: "rgba(15, 23, 42, 0.9)",
  surface2: "rgba(30, 41, 59, 0.95)",
  surface3: "#1e293b",
  textPrimary: "#f8fafc",
  textSecondary: "#94a3b8",
  textTertiary: "#64748b",
  border: "rgba(255, 255, 255, 0.12)",
  borderSubtle: "rgba(255, 255, 255, 0.06)",
  ...sharedStatus,
} as const;

/** Places — clean deep emerald/teal dark theme with fresh mint accents. */
const placesSemantic = {
  accent: "#2dd4bf",
  accentHover: "#5eead4",
  accentMuted: "rgba(45, 212, 191, 0.2)",
  accentLight: "#ccfbf1",
  secondary: "#a78bfa",
  secondaryHover: "#c4b5fd",
  secondaryMuted: "rgba(167, 139, 250, 0.2)",
  tertiary: "#67e8f9",
  tertiaryHover: "#a5f3fc",
  background: "#071318",
  surface: "rgba(13, 31, 38, 0.85)",
  surfaceElevated: "rgba(19, 47, 56, 0.95)",
  surface0: "#071318",
  surface1: "rgba(13, 31, 38, 0.9)",
  surface2: "rgba(19, 47, 56, 0.95)",
  surface3: "#132f38",
  textPrimary: "#f0fdfa",
  textSecondary: "#99f6e4",
  textTertiary: "#5eead4",
  border: "rgba(45, 212, 191, 0.18)",
  borderSubtle: "rgba(45, 212, 191, 0.08)",
  ...sharedStatus,
} as const;

const buildCleanCssVars = (
  semantic: typeof moviesSemantic | typeof placesSemantic,
  accentColor: string,
  secondaryColor: string,
): Record<string, string> => ({
  "--color-accent": semantic.accent,
  "--color-accent-hover": semantic.accentHover,
  "--color-accent-muted": semantic.accentMuted,
  "--color-accent-light": semantic.accentLight,
  "--color-secondary": semantic.secondary,
  "--color-secondary-hover": semantic.secondaryHover,
  "--color-secondary-muted": semantic.secondaryMuted,
  "--color-tertiary": semantic.tertiary,
  "--color-tertiary-hover": semantic.tertiaryHover,
  "--color-background": semantic.background,
  "--color-surface": semantic.surface,
  "--color-surface-elevated": semantic.surfaceElevated,
  "--color-surface-0": semantic.surface0,
  "--color-surface-1": semantic.surface1,
  "--color-surface-2": semantic.surface2,
  "--color-surface-3": semantic.surface3,
  "--color-text-primary": semantic.textPrimary,
  "--color-text-secondary": semantic.textSecondary,
  "--color-text-tertiary": semantic.textTertiary,
  "--color-border": semantic.border,
  "--color-border-subtle": semantic.borderSubtle,
  "--color-success": semantic.success,
  "--color-warning": semantic.warning,
  "--color-error": semantic.error,
  "--color-overlay": semantic.overlay,
  "--glow-primary": `0 0 20px ${semantic.accentMuted}`,
  "--glow-strong": `0 0 32px ${semantic.accentMuted}`,
  "--gradient-primary": `linear-gradient(135deg, ${accentColor} 0%, ${secondaryColor} 100%)`,
  "--gradient-card": `linear-gradient(180deg, ${semantic.surface1} 0%, ${semantic.surface2} 100%)`,
  "--gradient-shell": `linear-gradient(180deg, ${semantic.surface0} 0%, ${semantic.background} 100%)`,
  "--moire-color-1": accentColor,
  "--moire-color-2": secondaryColor,
  "--moire-accent": accentColor,
  "--shell-border": semantic.borderSubtle,
  "--shell-header-surface": semantic.surface1,
  "--shell-panel-surface": semantic.surface2,
  "--shadow-card": "0 4px 20px rgba(0, 0, 0, 0.25)",
  "--shadow-elevated": "0 10px 30px rgba(0, 0, 0, 0.35)",
  "--shadow-floating": "0 16px 40px rgba(0, 0, 0, 0.45)",
  "--focus-ring": `color-mix(in srgb, ${semantic.accent} 60%, transparent)`,
  "--font-heading": "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
  "--font-body": "'Outfit', system-ui, -apple-system, sans-serif",
  "--font-mono": "'JetBrains Mono', monospace",
  "--font-retro": "'Plus Jakarta Sans', system-ui, sans-serif",
  "--font-interface": "'Outfit', system-ui, -apple-system, sans-serif",
  "--font-size-xs": "0.75rem",
  "--letter-spacing-wider": "0.04em",
  "--letter-spacing-eyebrow": "0.06em",
  "--chrome-radius-sm": "0.875rem",
  "--chrome-surface": semantic.surface1,
  "--chrome-shadow": "0 10px 30px rgba(0, 0, 0, 0.35)",
  "--chrome-shadow-soft": "0 4px 16px rgba(0, 0, 0, 0.2)",
  "--chrome-highlight-top": "rgba(255, 255, 255, 0.08)",
  "--gallery-accent": accentColor,
  "--bubble-color": semantic.surfaceElevated,
});

export const moviesThemeDefinition: AppThemeDefinition = {
  name: "movies",
  label: "Movies",
  semantic: moviesSemantic,
  moire: {
    color1: "#38bdf8",
    color2: "#818cf8",
    accent: "#38bdf8",
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
      "linear-gradient(180deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.95) 100%)",
    glow: "0 0 20px rgba(56, 189, 248, 0.15)",
    glowStrong: "0 0 30px rgba(56, 189, 248, 0.25)",
  },
  shell: {
    canvasGap: "1rem",
    canvasPaddingBlock: "0.5rem",
    stackGap: "1rem",
    stackPaddingTop: "0.75rem",
    stackPaddingBottom: "1rem",
    panelBorderStrong: "rgba(255, 255, 255, 0.15)",
    panelBorderSoft: "rgba(255, 255, 255, 0.08)",
    panelHighlight: "rgba(255, 255, 255, 0.05)",
    panelGlass: "rgba(15, 23, 42, 0.8)",
    panelShadow: "0 8px 32px rgba(0, 0, 0, 0.35)",
    panelShadowSoft: "0 4px 16px rgba(0, 0, 0, 0.2)",
    headerSurface:
      "linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(9, 13, 22, 0.95) 100%)",
    panelSurface: "rgba(15, 23, 42, 0.9)",
  },
  cssVars: buildCleanCssVars(moviesSemantic, "#38bdf8", "#818cf8"),
};

export const placesThemeDefinition: AppThemeDefinition = {
  name: "places",
  label: "Places",
  semantic: placesSemantic,
  moire: {
    color1: "#2dd4bf",
    color2: "#a78bfa",
    accent: "#2dd4bf",
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
      "linear-gradient(180deg, rgba(13, 31, 38, 0.9) 0%, rgba(19, 47, 56, 0.95) 100%)",
    glow: "0 0 20px rgba(45, 212, 191, 0.18)",
    glowStrong: "0 0 30px rgba(45, 212, 191, 0.28)",
  },
  shell: {
    canvasGap: "1rem",
    canvasPaddingBlock: "0.5rem",
    stackGap: "1rem",
    stackPaddingTop: "0.75rem",
    stackPaddingBottom: "1rem",
    panelBorderStrong: "rgba(45, 212, 191, 0.2)",
    panelBorderSoft: "rgba(45, 212, 191, 0.08)",
    panelHighlight: "rgba(45, 212, 191, 0.05)",
    panelGlass: "rgba(13, 31, 38, 0.8)",
    panelShadow: "0 8px 32px rgba(0, 0, 0, 0.35)",
    panelShadowSoft: "0 4px 16px rgba(0, 0, 0, 0.2)",
    headerSurface:
      "linear-gradient(180deg, rgba(13, 31, 38, 0.95) 0%, rgba(7, 19, 24, 0.95) 100%)",
    panelSurface: "rgba(13, 31, 38, 0.9)",
  },
  cssVars: buildCleanCssVars(placesSemantic, "#2dd4bf", "#a78bfa"),
};

export const appThemes: Record<ThemeName, AppThemeDefinition> = {
  movies: moviesThemeDefinition,
  places: placesThemeDefinition,
};

export const getAppTheme = (name: ThemeName): AppThemeDefinition =>
  appThemes[name] ?? moviesThemeDefinition;

// ============================================================================
// Apply Theme Utility (originally from applyTheme.ts)
// ============================================================================

/**
 * Applies the active theme to the document via data-theme attribute and updates theme-color meta.
 */
export const applyTheme = (themeName: ThemeName): void => {
  if (typeof document === "undefined") {
    return;
  }

  const theme = getAppTheme(themeName);
  const root = document.documentElement;
  const { body } = document;

  root.setAttribute("data-theme", themeName);
  body.setAttribute("data-theme", themeName);

  const themeMeta = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]',
  );
  themeMeta?.setAttribute("content", theme.semantic.background);
};

/** Clears theme attribute overrides (used in tests). */
export const clearAppliedTheme = (): void => {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.removeAttribute("data-theme");
  document.body.removeAttribute("data-theme");
};

// ============================================================================
// Design Tokens (originally from tokens.ts)
// ============================================================================

export const shellTokens = moviesThemeDefinition.shell;

export const spacing = {
  xs: "0.25rem", // 4px
  sm: "0.5rem", // 8px
  md: "1rem", // 16px
  lg: "1.25rem", // 20px
  xl: "1.75rem", // 28px
  "2xl": "2.5rem", // 40px
  "3xl": "3.5rem", // 56px
} as const;

export const colors = {
  ...moviesThemeDefinition.semantic,
  interactive: moviesThemeDefinition.semantic.accent,
  interactiveHover: moviesThemeDefinition.semantic.accentHover,
  borderSecondary: "rgba(255, 255, 255, 0.16)",
  borderTertiary: "rgba(56, 189, 248, 0.2)",
  borderInset: "rgba(255, 255, 255, 0.2)",
  yellow: "#facc15",
  khaki: "#bae6fd",
  gradientPink: "linear-gradient(135deg, #f472b6 0%, #fb7185 100%)",
  gradientBlue: "linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)",
  gradientPurple: "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)",
  gradientCard: moviesThemeDefinition.tokens.gradientCard,
} as const;

const fontFamily = {
  heading: ["'Plus Jakarta Sans'", "system-ui", "-apple-system", "sans-serif"],
  body: ["'Outfit'", "system-ui", "-apple-system", "sans-serif"],
  sans: ["'Outfit'", "system-ui", "-apple-system", "sans-serif"],
  display: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
  mono: ["'JetBrains Mono'", "SFMono-Regular", "Consolas", "monospace"],
} as const;

const fontFamilyValue = {
  heading: fontFamily.heading.join(", "),
  body: fontFamily.body.join(", "),
  sans: fontFamily.sans.join(", "),
  display: fontFamily.display.join(", "),
  mono: fontFamily.mono.join(", "),
} as const;

const fontSize = {
  "3xs": "0.5625rem",
  "2xs": "0.625rem",
  xs: "0.75rem",
  sm: "0.875rem",
  base: "1rem",
  lg: "1.125rem",
  xl: "1.25rem",
  "2xl": "1.5rem",
  "3xl": "1.875rem",
  "4xl": "2.25rem",
} as const;

const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
} as const;

const lineHeight = {
  none: 1,
  heading: 1.2,
  snug: 1.25,
  tight: 1.3,
  normal: 1.5,
  relaxed: 1.75,
} as const;

const letterSpacing = {
  display: "-0.02em",
  none: "0",
  tight: "-0.01em",
  normal: "0",
  wide: "0.02em",
  dense: "0.01em",
  button: "0.02em",
  wider: "0.04em",
  eyebrow: "0.06em",
  widest: "0.1em",
} as const;

export const typography = {
  fontFamily,
  fontFamilyValue,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  presets: {
    eyebrow: {
      fontFamily: fontFamilyValue.body,
      fontSize: "0.75rem",
      fontWeight: fontWeight.semibold,
      lineHeight: lineHeight.none,
      letterSpacing: letterSpacing.eyebrow,
      textTransform: "uppercase",
    },
    buttonLabel: {
      fontFamily: fontFamilyValue.heading,
      fontWeight: fontWeight.semibold,
      lineHeight: lineHeight.none,
      letterSpacing: letterSpacing.button,
      textTransform: "none",
    },
    titleSm: {
      fontFamily: fontFamilyValue.heading,
      fontSize: "1.125rem",
      fontWeight: fontWeight.semibold,
      lineHeight: lineHeight.heading,
      letterSpacing: letterSpacing.tight,
    },
    titleMd: {
      fontFamily: fontFamilyValue.heading,
      fontSize: "1.375rem",
      fontWeight: fontWeight.bold,
      lineHeight: lineHeight.heading,
      letterSpacing: letterSpacing.tight,
    },
    tabLabel: {
      fontFamily: fontFamilyValue.heading,
      fontSize: "0.8125rem",
      fontWeight: fontWeight.semibold,
      lineHeight: lineHeight.none,
      letterSpacing: letterSpacing.wide,
      textTransform: "none",
    },
    badge: {
      fontFamily: fontFamilyValue.heading,
      fontSize: "0.7rem",
      fontWeight: fontWeight.bold,
      lineHeight: lineHeight.none,
      letterSpacing: letterSpacing.wide,
      textTransform: "uppercase",
    },
    caption: {
      fontFamily: fontFamilyValue.body,
      fontSize: fontSize["2xs"],
      lineHeight: lineHeight.tight,
    },
    micro: {
      fontFamily: fontFamilyValue.body,
      fontSize: fontSize["3xs"],
      lineHeight: lineHeight.tight,
    },
    bodySm: {
      fontFamily: fontFamilyValue.body,
      fontSize: fontSize.sm,
      lineHeight: lineHeight.normal,
    },
    bodyXs: {
      fontFamily: fontFamilyValue.body,
      fontSize: fontSize.xs,
      lineHeight: lineHeight.normal,
    },
    posterTitle: {
      fontFamily: fontFamilyValue.heading,
      fontSize: "0.95rem",
      fontWeight: fontWeight.bold,
      lineHeight: lineHeight.heading,
      letterSpacing: "0.01em",
      textTransform: "none",
    },
  },
} as const;

export const motion = {
  duration: {
    fast: "120ms",
    normal: "200ms",
    slow: "300ms",
    button: "100ms",
    theme: "200ms",
  },
  reducedDuration: {
    fast: "0.01ms",
    normal: "0.01ms",
    slow: "0.01ms",
    button: "0.01ms",
    theme: "0.01ms",
  },
  easing: {
    ease: "cubic-bezier(0.16, 1, 0.3, 1)",
    easeIn: "cubic-bezier(0.4, 0, 1, 1)",
    easeOut: "cubic-bezier(0, 0, 0.2, 1)",
    easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    linear: "linear",
  },
} as const;

export const radius = {
  none: "0",
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem",
  card: "1rem",
  xl: "1.25rem",
  full: "9999px",
} as const;

export const shadows = {
  card: "0 2px 10px rgba(0,0,0,0.2)",
  cardHover: "0 8px 24px rgba(0,0,0,0.35)",
  cardElevated: "0 10px 30px rgba(0,0,0,0.4)",
  button: "0 1px 3px rgba(0,0,0,0.2)",
  buttonHover: "0 4px 12px rgba(0,0,0,0.3)",
  buttonActive: "0 1px 2px rgba(0,0,0,0.2)",
  buttonLarge: "0 4px 14px rgba(0,0,0,0.35)",
  glow: "0 0 16px rgba(56, 189, 248, 0.25)",
  glowStrong: "0 0 28px rgba(56, 189, 248, 0.4)",
  glowBlue: "0 0 20px rgba(56, 189, 248, 0.3)",
  glowYellow: "0 0 20px rgba(250, 204, 21, 0.3)",
  textGlow: "none",
  textGlowBlue: "none",
  textGlowYellow: "none",
  textGradientPink: "linear-gradient(135deg, #f472b6 0%, #fda4af 100%)",
  textGradientBlue: "linear-gradient(135deg, #38bdf8 0%, #93c5fd 100%)",
  textGradientYellow: "linear-gradient(135deg, #fde047 0%, #fef08a 100%)",
  textOutline: "none",
  floating: "0 12px 36px rgba(0,0,0,0.5)",
} as const;

export const zIndex = {
  base: 0,
  elevated: 10,
  dropdown: 100,
  overlay: 900,
  modal: 2000,
  tooltip: 2100,
} as const;
