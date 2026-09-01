/**
 * DOM, Preferences, Fonts and View Transitions Utilities
 */

export const copyTextToClipboard = async (value: string): Promise<void> => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const fallbackField = document.createElement("textarea");
  fallbackField.value = value;
  fallbackField.setAttribute("readonly", "true");
  fallbackField.style.position = "fixed";
  fallbackField.style.opacity = "0";
  fallbackField.style.pointerEvents = "none";

  document.body.appendChild(fallbackField);
  fallbackField.focus();
  fallbackField.select();

  const didCopy = document.execCommand("copy");
  document.body.removeChild(fallbackField);

  if (!didCopy) {
    throw new Error("Clipboard unavailable");
  }
};

export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const hasHoverCapability = (): boolean =>
  typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;

export const hasFinePointer = (): boolean =>
  typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;

export const isChromaSpotlightEnabled = (): boolean =>
  !prefersReducedMotion() && hasHoverCapability() && hasFinePointer();

export const subscribeMotionPreferences = (
  onChange: () => void,
): (() => void) => {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const motionMq = window.matchMedia("(prefers-reduced-motion: reduce)");
  const hoverMq = window.matchMedia("(hover: hover)");
  motionMq.addEventListener("change", onChange);
  hoverMq.addEventListener("change", onChange);

  return () => {
    motionMq.removeEventListener("change", onChange);
    hoverMq.removeEventListener("change", onChange);
  };
};

const SOUND_STORAGE_KEY = "uiSoundsEnabled";
const soundListeners = new Set<() => void>();

export const getStoredSoundPreference = (): boolean | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SOUND_STORAGE_KEY);
    if (raw === "false") return false;
    if (raw === "true") return true;
    return null;
  } catch {
    return null;
  }
};

export const isSoundEnabled = (): boolean => {
  const stored = getStoredSoundPreference();
  if (stored !== null) return stored;
  return !prefersReducedMotion();
};

export const setSoundEnabled = (enabled: boolean): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SOUND_STORAGE_KEY, enabled ? "true" : "false");
  } catch {
    // Ignore quota/privacy mode errors
  }
  soundListeners.forEach((listener) => listener());
};

export const subscribeSoundPreference = (
  onChange: () => void,
): (() => void) => {
  soundListeners.add(onChange);
  return () => {
    soundListeners.delete(onChange);
  };
};

export function scrollToWorkspaceSection(sectionId: string): boolean {
  if (typeof document === "undefined") return false;
  const section = document.getElementById(sectionId);
  if (!section) return false;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  section.scrollIntoView({
    behavior: reducedMotion ? "auto" : "smooth",
    block: "start",
  });

  if (!section.hasAttribute("tabindex")) {
    section.setAttribute("tabindex", "-1");
  }

  window.requestAnimationFrame(() => {
    section.focus({ preventScroll: true });
  });

  return true;
}

const FEATURE_FONTS_STYLESHEET_ID = "electron-feature-fonts";
const FEATURE_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Outfit:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Syne:wght@600;700;800&family=JetBrains+Mono:wght@400;500&display=swap";

export function loadFeatureFonts(): Promise<boolean> {
  if (typeof document === "undefined") {
    return Promise.resolve(false);
  }

  const existingLink = document.getElementById(FEATURE_FONTS_STYLESHEET_ID);
  if (existingLink) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const link = document.createElement("link");
    link.id = FEATURE_FONTS_STYLESHEET_ID;
    link.rel = "stylesheet";
    link.href = FEATURE_FONTS_HREF;

    link.onload = () => resolve(true);
    link.onerror = () => resolve(false);

    document.head.appendChild(link);
  });
}

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void | Promise<void>) => {
    ready: Promise<void>;
    finished: Promise<void>;
    updateCallbackDone: Promise<void>;
  };
};

export function runWithViewTransition(
  callback: () => void,
  skip: boolean = false,
): void {
  if (typeof document === "undefined" || skip) {
    callback();
    return;
  }

  const doc = document as ViewTransitionDocument;
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (doc.startViewTransition && !reducedMotion) {
    doc.startViewTransition(callback);
    return;
  }

  callback();
}
