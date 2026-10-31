/**
 * The boot screen in index.html (#boot-splash) covers the app until the movie wall is ready,
 * so startup shows one loader instead of three. It fades out (opacity only) and is removed.
 */
const BOOT_FADE_MS = 360;
/** Never hold the boot screen longer than this after React mounts; the in-wall loader takes over. */
export const BOOT_SPLASH_MAX_MS = 3_000;

export function dismissBootSplash(): void {
  if (typeof document === "undefined") return;
  const splash = document.getElementById("boot-splash");
  if (!splash || splash.dataset.leaving === "true") return;
  splash.dataset.leaving = "true";
  splash.classList.add("is-leaving");
  window.setTimeout(() => splash.remove(), BOOT_FADE_MS);
}
