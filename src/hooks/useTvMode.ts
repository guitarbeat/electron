import { useEffect, useState, useCallback } from 'react';

/**
 * Detects if the app is running on a Smart TV / Fire TV browser.
 *
 * Detection heuristics:
 * - User agent contains "silk", "firetv", "tizen", "webos", or "smart-tv"
 * - Large viewport (960px+) with coarse pointer or no pointer
 * - Manual override via localStorage 'tv-mode' or URL param ?tv=1
 *
 * When active, adds `data-tv-mode="true"` to <html> for CSS hooks.
 */
export function useTvMode(): { isTvMode: boolean; toggleTvMode: () => void } {
  const [isTvMode, setIsTvMode] = useState(() => detectTvMode());

  useEffect(() => {
    const root = document.documentElement;
    if (isTvMode) {
      root.setAttribute('data-tv-mode', 'true');
    } else {
      root.removeAttribute('data-tv-mode');
    }
  }, [isTvMode]);

  const toggleTvMode = useCallback(() => {
    setIsTvMode((prev) => {
      const next = !prev;
      try {
        if (next) {
          localStorage.setItem('electron:tv-mode', '1');
        } else {
          localStorage.removeItem('electron:tv-mode');
        }
      } catch {
        // Storage unavailable
      }
      return next;
    });
  }, []);

  return { isTvMode, toggleTvMode };
}

function detectTvMode(): boolean {
  if (typeof window === 'undefined') return false;

  // Manual override via localStorage
  try {
    if (localStorage.getItem('electron:tv-mode') === '1') return true;
  } catch {
    // Ignore
  }

  // URL param override: ?tv=1
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tv') === '1') return true;
  } catch {
    // Ignore
  }

  // User-agent sniffing for known TV browsers
  const ua = navigator.userAgent.toLowerCase();
  const tvUserAgents = ['silk', 'firetv', 'fire tv', 'tizen', 'webos', 'smart-tv', 'smarttv', 'netcast', 'crkey'];
  if (tvUserAgents.some((token) => ua.includes(token))) return true;

  // Media query: large screen + no hover / coarse pointer
  const isLargeScreen = window.matchMedia('(min-width: 960px)').matches;
  const noHover = window.matchMedia('(hover: none)').matches;
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;

  if (isLargeScreen && (noHover || coarsePointer)) return true;

  return false;
}

export default useTvMode;
