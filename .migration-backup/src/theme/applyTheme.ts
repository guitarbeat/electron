import { getAppTheme, type ThemeName } from './themes.ts';

const SHELL_VAR_KEYS = [
  '--shell-canvas-gap',
  '--shell-canvas-padding-block',
  '--shell-stack-gap',
  '--shell-stack-padding-top',
  '--shell-stack-padding-bottom',
  '--shell-panel-border-strong',
  '--shell-panel-border-soft',
  '--shell-panel-highlight',
  '--shell-panel-glass',
  '--shell-panel-shadow',
  '--shell-panel-shadow-soft',
] as const;

/**
 * Applies the active theme to the document: data-theme on body plus all palette CSS variables on :root.
 */
export const applyTheme = (themeName: ThemeName): void => {
  if (typeof document === 'undefined') {
    return;
  }

  const theme = getAppTheme(themeName);
  const root = document.documentElement;
  const { body } = document;

  body.setAttribute('data-theme', themeName);

  Object.entries(theme.cssVars).forEach(([name, value]) => {
    root.style.setProperty(name, value);
  });

  root.style.setProperty('--shell-canvas-gap', theme.shell.canvasGap);
  root.style.setProperty('--shell-canvas-padding-block', theme.shell.canvasPaddingBlock);
  root.style.setProperty('--shell-stack-gap', theme.shell.stackGap);
  root.style.setProperty('--shell-stack-padding-top', theme.shell.stackPaddingTop);
  root.style.setProperty('--shell-stack-padding-bottom', theme.shell.stackPaddingBottom);
  root.style.setProperty('--shell-panel-border-strong', theme.shell.panelBorderStrong);
  root.style.setProperty('--shell-panel-border-soft', theme.shell.panelBorderSoft);
  root.style.setProperty('--shell-panel-highlight', theme.shell.panelHighlight);
  root.style.setProperty('--shell-panel-glass', theme.shell.panelGlass);
  root.style.setProperty('--shell-panel-shadow', theme.shell.panelShadow);
  root.style.setProperty('--shell-panel-shadow-soft', theme.shell.panelShadowSoft);

  const themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  themeMeta?.setAttribute('content', theme.semantic.background);
};

/** Clears inline theme overrides (used in tests). */
export const clearAppliedTheme = (): void => {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  const theme = getAppTheme('movies');

  [...Object.keys(theme.cssVars), ...SHELL_VAR_KEYS].forEach((name) => {
    root.style.removeProperty(name);
  });
};
