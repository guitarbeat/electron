/**
 * Canonical app themes — single source for CSS variables, shell chrome, and moiré accents.
 * SCSS should consume these via `applyTheme()`; avoid duplicating palette hex in stylesheets.
 */

export type ThemeName = "movies" | "places";

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
  success: "#86efac",
  warning: "#fde68a",
  error: "#fca5a5",
  overlay: "rgba(3, 5, 18, 0.88)",
} as const;

/** Movies — deep space: teal-blue accent on near-black navy. */
const moviesSemantic = {
  accent: "#38bdf8",
  accentHover: "#7dd3fc",
  accentMuted: "#38bdf840",
  accentLight: "#e0f2fe",
  secondary: "#818cf8",
  secondaryHover: "#a5b4fc",
  secondaryMuted: "#818cf840",
  tertiary: "#34d399",
  tertiaryHover: "#6ee7b7",
  background: "#060810",
  surface: "rgba(10, 15, 38, 0.76)",
  surfaceElevated: "rgba(14, 20, 48, 0.88)",
  surface0: "#05070e",
  surface1: "rgba(12, 18, 42, 0.85)",
  surface2: "rgba(16, 24, 54, 0.92)",
  surface3: "rgba(22, 32, 68, 0.96)",
  textPrimary: "#f0f4ff",
  textSecondary: "#94a3b8",
  textTertiary: "#4a5a7a",
  border: "rgba(148, 163, 200, 0.18)",
  borderSubtle: "rgba(148, 163, 200, 0.08)",
  ...sharedStatus,
} as const;

/** Places — bioluminescent reef: teal × violet on deep ocean navy. */
const placesSemantic = {
  accent: "#2dd4bf",
  accentHover: "#5eead4",
  accentMuted: "#2dd4bf40",
  accentLight: "#ccfbf1",
  secondary: "#a78bfa",
  secondaryHover: "#c4b5fd",
  secondaryMuted: "#a78bfa40",
  tertiary: "#67e8f9",
  tertiaryHover: "#a5f3fc",
  background: "#070f1a",
  surface: "rgba(10, 22, 48, 0.76)",
  surfaceElevated: "rgba(14, 32, 62, 0.86)",
  surface0: "#060d18",
  surface1: "rgba(12, 26, 54, 0.82)",
  surface2: "rgba(16, 34, 66, 0.9)",
  surface3: "rgba(22, 44, 80, 0.94)",
  textPrimary: "#ecfeff",
  textSecondary: "#82b4c8",
  textTertiary: "#4a7a8a",
  border: "rgba(103, 232, 249, 0.22)",
  borderSubtle: "rgba(103, 232, 249, 0.1)",
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
    chromeHighlightTop: string;
    chromeShadowSoft: string;
    chromeShadow: string;
    moire1: string;
    moire2: string;
    moireAccent: string;
    waxAccent?: string;
    shellBorder: string;
    headerSurface: string;
    panelSurface: string;
  },
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
  "--color-quaternary": extras.quaternary,
  "--color-quinary": extras.quinary,
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
  "--glow-primary": extras.glowPrimary,
  "--glow-strong": extras.glowStrong,
  "--gradient-primary": extras.gradientPrimary,
  "--gradient-card": extras.gradientCard,
  "--gradient-shell": extras.gradientShell,
  "--gradient-metal-bg": extras.gradientMetalBg,
  "--gradient-metal-surface": extras.gradientMetalSurface,
  "--gradient-metal-pill": extras.gradientMetalPill,
  "--y2k-metal-glint-a": extras.y2kGlintA,
  "--y2k-metal-glint-b": extras.y2kGlintB,
  "--moire-color-1": extras.moire1,
  "--moire-color-2": extras.moire2,
  "--moire-accent": extras.moireAccent,
  "--shell-border": extras.shellBorder,
  "--shell-header-surface": extras.headerSurface,
  "--shell-panel-surface": extras.panelSurface,
  "--texture-paper-surface": extras.panelSurface,
  "--texture-grain-strength": "0.04",
  "--texture-fiber-strength": "0.03",
  "--texture-vignette-strength": "0.38",
  "--chrome-surface": extras.panelSurface,
  "--chrome-radius-sm": "0.9rem",
  "--chrome-radius": "1.3rem",
  "--chrome-radius-lg": "1.85rem",
  "--chrome-pill-radius": "999px",
  "--chrome-border-color": semantic.border,
  "--chrome-highlight-top": extras.chromeHighlightTop,
  "--chrome-shadow-soft": extras.chromeShadowSoft,
  "--chrome-shadow": extras.chromeShadow,
  "--chrome-blur": "blur(40px) saturate(2)",
  "--shadow-card":
    "0 16px 26px rgba(2, 4, 18, 0.24), inset 0 1px 0 color-mix(in srgb, var(--color-text-primary) 6%, transparent)",
  "--shadow-elevated":
    "0 22px 38px rgba(2, 4, 18, 0.38), inset 0 1px 0 color-mix(in srgb, var(--color-text-primary) 9%, transparent)",
  "--shadow-floating": extras.glowStrong,
  "--focus-ring": `color-mix(in srgb, ${semantic.accent} 70%, transparent)`,
  "--font-display": "'Syne', 'Plus Jakarta Sans', sans-serif",
  "--font-heading": "'Plus Jakarta Sans', 'Outfit', sans-serif",
  "--font-body": "'Outfit', system-ui, -apple-system, sans-serif",
  "--font-mono": "'JetBrains Mono', monospace",
  "--color-background-oklch": "oklch(0.12 0.02 260)",
  "--color-surface-oklch": "oklch(0.16 0.03 260)",
  "--color-accent-oklch": "oklch(0.74 0.16 232)",
  "--color-secondary-oklch": "oklch(0.65 0.18 280)",
  ...(extras.waxAccent ? { "--wax-accent": extras.waxAccent } : {}),
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
      "linear-gradient(178deg, rgba(12, 18, 42, 0.95) 0%, rgba(8, 12, 32, 0.92) 52%, rgba(5, 7, 14, 0.94) 100%)",
    glow: "0 0 20px rgba(56, 189, 248, 0.12), 0 0 36px rgba(129, 140, 248, 0.08)",
    glowStrong:
      "0 0 28px rgba(56, 189, 248, 0.2), 0 0 48px rgba(224, 242, 254, 0.1)",
  },
  shell: {
    canvasGap: "clamp(0.7rem, 0.38rem + 0.8vw, 1.15rem)",
    canvasPaddingBlock: "clamp(0.3rem, 0.18rem + 0.4vw, 0.7rem)",
    stackGap: "clamp(0.85rem, 0.68rem + 0.55vw, 1.3rem)",
    stackPaddingTop: "clamp(0.55rem, 0.42rem + 0.55vw, 0.95rem)",
    stackPaddingBottom: "clamp(0.8rem, 0.6rem + 0.8vw, 1.35rem)",
    panelBorderStrong: "rgba(200, 215, 255, 0.18)",
    panelBorderSoft: "rgba(200, 215, 255, 0.08)",
    panelHighlight: "rgba(255, 230, 255, 0.07)",
    panelGlass: "rgba(255, 230, 255, 0.025)",
    panelShadow: "0 22px 48px rgba(2, 4, 18, 0.42)",
    panelShadowSoft: "0 12px 26px rgba(2, 4, 18, 0.24)",
    headerSurface:
      "linear-gradient(155deg, rgba(20, 32, 72, 0.96) 0%, rgba(10, 16, 42, 0.97) 58%, rgba(6, 8, 26, 0.98) 100%)",
    panelSurface:
      "linear-gradient(165deg, rgba(18, 28, 66, 0.93) 0%, rgba(10, 16, 42, 0.95) 45%, rgba(6, 8, 26, 0.97) 100%)",
  },
  cssVars: buildCssVars(moviesSemantic, {
    quaternary: "#818cf8",
    quinary: "#38bdf8",
    glowPrimary:
      "0 0 20px rgba(56, 189, 248, 0.12), 0 0 36px rgba(129, 140, 248, 0.08)",
    glowStrong:
      "0 0 28px rgba(56, 189, 248, 0.2), 0 0 48px rgba(224, 242, 254, 0.1)",
    gradientPrimary:
      "linear-gradient(128deg, #38bdf8 0%, #818cf8 42%, #e0f2fe 100%)",
    gradientCard:
      "linear-gradient(178deg, rgba(12, 18, 42, 0.95) 0%, rgba(8, 12, 32, 0.92) 52%, rgba(5, 7, 14, 0.94) 100%)",
    gradientShell:
      "linear-gradient(182deg, #080c1a 0%, #060a16 42%, #050812 72%, #030610 100%)",
    gradientMetalBg:
      "linear-gradient(182deg, #080c1a 0%, #060a16 42%, #050812 72%, #030610 100%)",
    gradientMetalSurface:
      "linear-gradient(180deg, #e0f2fe 0%, #7dd3fc 38%, #38bdf8 72%, #0369a1 100%)",
    gradientMetalPill:
      "linear-gradient(180deg, #f0f9ff 0%, #bae6fd 38%, #38bdf8 100%)",
    y2kGlintA: "rgba(224, 242, 254, 0.12)",
    y2kGlintB: "rgba(129, 140, 248, 0.08)",
    chromeHighlightTop:
      "linear-gradient(180deg, rgba(240, 244, 255, 0.12) 0%, rgba(240, 244, 255, 0.05) 14%, transparent 58%)",
    chromeShadowSoft:
      "0 18px 36px rgba(2, 4, 12, 0.4), inset 0 1px 0 rgba(240, 244, 255, 0.04)",
    chromeShadow:
      "0 28px 52px rgba(2, 4, 12, 0.5), inset 0 1px 0 rgba(240, 244, 255, 0.06)",
    moire1: "#38bdf8",
    moire2: "#818cf8",
    moireAccent: "#38bdf8",
    waxAccent: "#0c4a6e",
    shellBorder: "rgba(148, 163, 200, 0.1)",
    headerSurface:
      "linear-gradient(155deg, rgba(12, 18, 48, 0.97) 0%, rgba(8, 12, 32, 0.98) 58%, rgba(5, 7, 18, 0.99) 100%)",
    panelSurface:
      "linear-gradient(165deg, rgba(10, 16, 40, 0.95) 0%, rgba(7, 11, 28, 0.97) 45%, rgba(5, 7, 18, 0.98) 100%)",
  }),
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
      "linear-gradient(178deg, rgba(10, 30, 62, 0.94) 0%, rgba(6, 18, 44, 0.9) 52%, rgba(4, 10, 30, 0.92) 100%)",
    glow: "0 0 20px rgba(45, 212, 191, 0.18), 0 0 36px rgba(167, 139, 250, 0.1)",
    glowStrong:
      "0 0 28px rgba(45, 212, 191, 0.26), 0 0 48px rgba(204, 251, 241, 0.14)",
  },
  shell: {
    canvasGap: "clamp(0.7rem, 0.38rem + 0.8vw, 1.15rem)",
    canvasPaddingBlock: "clamp(0.3rem, 0.18rem + 0.4vw, 0.7rem)",
    stackGap: "clamp(0.85rem, 0.68rem + 0.55vw, 1.3rem)",
    stackPaddingTop: "clamp(0.55rem, 0.42rem + 0.55vw, 0.95rem)",
    stackPaddingBottom: "clamp(0.8rem, 0.6rem + 0.8vw, 1.35rem)",
    panelBorderStrong: "rgba(103, 232, 249, 0.2)",
    panelBorderSoft: "rgba(103, 232, 249, 0.09)",
    panelHighlight: "rgba(204, 251, 241, 0.07)",
    panelGlass: "rgba(204, 251, 241, 0.025)",
    panelShadow: "0 22px 48px rgba(2, 4, 20, 0.42)",
    panelShadowSoft: "0 12px 26px rgba(2, 4, 20, 0.24)",
    headerSurface:
      "linear-gradient(155deg, rgba(10, 30, 64, 0.96) 0%, rgba(6, 18, 44, 0.97) 58%, rgba(4, 10, 28, 0.98) 100%)",
    panelSurface:
      "linear-gradient(165deg, rgba(8, 26, 58, 0.93) 0%, rgba(6, 16, 42, 0.95) 45%, rgba(4, 10, 26, 0.97) 100%)",
  },
  cssVars: buildCssVars(placesSemantic, {
    quaternary: "#67e8f9",
    quinary: "#a78bfa",
    glowPrimary:
      "0 0 20px rgba(45, 212, 191, 0.18), 0 0 36px rgba(167, 139, 250, 0.1)",
    glowStrong:
      "0 0 28px rgba(45, 212, 191, 0.26), 0 0 48px rgba(204, 251, 241, 0.14)",
    gradientPrimary:
      "linear-gradient(128deg, #2dd4bf 0%, #5eead4 40%, #ccfbf1 100%)",
    gradientCard:
      "linear-gradient(178deg, rgba(10, 30, 62, 0.94) 0%, rgba(6, 18, 44, 0.9) 52%, rgba(4, 10, 30, 0.92) 100%)",
    gradientShell:
      "linear-gradient(182deg, #0a1828 0%, #071020 42%, #050c1a 72%, #030816 100%)",
    gradientMetalBg:
      "linear-gradient(182deg, #0a1828 0%, #071020 42%, #050c1a 72%, #030816 100%)",
    gradientMetalSurface:
      "linear-gradient(180deg, #ccfbf1 0%, #99f6e4 38%, #2dd4bf 72%, #065f46 100%)",
    gradientMetalPill:
      "linear-gradient(180deg, #f0fdfa 0%, #ccfbf1 38%, #2dd4bf 100%)",
    y2kGlintA: "rgba(204, 251, 241, 0.18)",
    y2kGlintB: "rgba(196, 181, 253, 0.12)",
    chromeHighlightTop:
      "linear-gradient(180deg, rgba(236, 254, 255, 0.2) 0%, rgba(236, 254, 255, 0.08) 14%, transparent 58%)",
    chromeShadowSoft:
      "0 18px 36px rgba(2, 4, 20, 0.36), inset 0 1px 0 rgba(236, 254, 255, 0.05)",
    chromeShadow:
      "0 28px 52px rgba(2, 4, 20, 0.44), inset 0 1px 0 rgba(236, 254, 255, 0.07)",
    moire1: "#2dd4bf",
    moire2: "#a78bfa",
    moireAccent: "#2dd4bf",
    shellBorder: "rgba(45, 212, 191, 0.18)",
    headerSurface:
      "linear-gradient(155deg, rgba(10, 30, 64, 0.96) 0%, rgba(6, 18, 44, 0.97) 58%, rgba(4, 10, 28, 0.98) 100%)",
    panelSurface:
      "linear-gradient(165deg, rgba(8, 26, 58, 0.93) 0%, rgba(6, 16, 42, 0.95) 45%, rgba(4, 10, 26, 0.97) 100%)",
  }),
};

export const appThemes: Record<ThemeName, AppThemeDefinition> = {
  movies: moviesThemeDefinition,
  places: placesThemeDefinition,
};

export const getAppTheme = (name: ThemeName): AppThemeDefinition =>
  appThemes[name];
