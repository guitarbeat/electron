import { prefersReducedMotion } from "./motionPreference.ts";

const STORAGE_KEY = "uiSoundsEnabled";

const listeners = new Set<() => void>();

export const getStoredSoundPreference = (): boolean | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "false") return false;
    if (raw === "true") return true;
    return null;
  } catch {
    return null;
  }
};

/** True when UI sounds should play. Honors explicit user choice, else reduced-motion default. */
export const isSoundEnabled = (): boolean => {
  const stored = getStoredSoundPreference();
  if (stored !== null) {
    return stored;
  }
  return !prefersReducedMotion();
};

export const setSoundEnabled = (enabled: boolean): void => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? "true" : "false");
  } catch {
    // Ignore quota / privacy-mode failures.
  }

  listeners.forEach((listener) => listener());
};

export const subscribeSoundPreference = (
  onChange: () => void,
): (() => void) => {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
};
