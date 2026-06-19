const FEATURE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&family=Cormorant+Garamond:wght@400;500;600;700&display=swap";

let featureFontsPromise: Promise<void> | null = null;

/** Loads quiz/memories webfonts on demand instead of blocking every page load. */
export const loadFeatureFonts = (): Promise<void> => {
  if (typeof document === "undefined") {
    return Promise.resolve();
  }

  if (featureFontsPromise) {
    return featureFontsPromise;
  }

  featureFontsPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLLinkElement>(
      'link[data-feature-fonts="true"]',
    );
    if (existing) {
      if (existing.sheet) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Feature fonts failed to load")),
        { once: true },
      );
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FEATURE_FONTS_URL;
    link.dataset.featureFonts = "true";
    link.addEventListener("load", () => resolve(), { once: true });
    link.addEventListener(
      "error",
      () => reject(new Error("Feature fonts failed to load")),
      { once: true },
    );
    document.head.appendChild(link);
  });

  return featureFontsPromise;
};
