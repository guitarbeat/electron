import { useEffect, useCallback, useRef } from 'react';

/**
 * Improves D-pad (arrow key) navigation for Smart TV remotes.
 *
 * Fire TV remotes emit standard keyboard events:
 * - Up/Down/Left/Right arrows for D-pad
 * - Enter for select
 * - Backspace for back
 *
 * This hook:
 * 1. Ensures focus starts on the first interactive element
 * 2. Adds spatial navigation fallback when native focus management fails
 * 3. Scrolls focused elements into view
 * 4. Handles the "back" button to close modals/panels
 */
export function useTvNavigation(enabled: boolean) {
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  // Set initial focus on first interactive element
  useEffect(() => {
    if (!enabled) return;

    // Delay to allow lazy content to render
    const timer = setTimeout(() => {
      const firstFocusable = document.querySelector<HTMLElement>(
        'main button, main a, main input, main [tabindex="0"], nav button, nav a'
      );
      if (firstFocusable && !document.activeElement?.closest('[role="dialog"]')) {
        firstFocusable.focus({ preventScroll: true });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [enabled]);

  // Spatial navigation helper
  const findNearestFocusable = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right', current: HTMLElement): HTMLElement | null => {
      const focusables = Array.from(
        document.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
        )
      ).filter((el) => {
        const style = getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
      });

      if (focusables.length === 0) return null;

      const currentRect = current.getBoundingClientRect();
      const cx = currentRect.left + currentRect.width / 2;
      const cy = currentRect.top + currentRect.height / 2;

      let best: HTMLElement | null = null;
      let bestDist = Infinity;

      for (const el of focusables) {
        if (el === current) continue;

        const rect = el.getBoundingClientRect();
        const ex = rect.left + rect.width / 2;
        const ey = rect.top + rect.height / 2;

        // Filter by direction
        const isInDirection =
          direction === 'up' ? ey < cy - 5 :
          direction === 'down' ? ey > cy + 5 :
          direction === 'left' ? ex < cx - 5 :
          ex > cx + 5;

        if (!isInDirection) continue;

        // Calculate weighted distance (prefer aligned elements)
        const dx = ex - cx;
        const dy = ey - cy;
        const isVertical = direction === 'up' || direction === 'down';
        const primaryDist = isVertical ? Math.abs(dy) : Math.abs(dx);
        const crossDist = isVertical ? Math.abs(dx) : Math.abs(dy);

        // Weight: prioritize elements aligned on the cross-axis
        const dist = primaryDist + crossDist * 2.5;

        if (dist < bestDist) {
          bestDist = dist;
          best = el;
        }
      }

      return best;
    },
    []
  );

  // Handle keyboard events for TV remote
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;

      // Map arrow keys to spatial navigation
      const dirMap: Record<string, 'up' | 'down' | 'left' | 'right'> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
      };

      const direction = dirMap[e.key];

      if (direction && active) {
        // Don't override native scroll in text inputs
        if (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA') {
          return;
        }

        const next = findNearestFocusable(direction, active);
        if (next) {
          e.preventDefault();
          next.focus({ preventScroll: false });
          next.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
          lastFocusedRef.current = next;
        }
      }

      // Handle "Back" button (Backspace on Fire TV)
      if (e.key === 'Backspace') {
        const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
        if (dialog) {
          e.preventDefault();
          // Look for close/dismiss button within the dialog
          const closeBtn = dialog.querySelector<HTMLElement>(
            'button[aria-label*="close" i], button[aria-label*="dismiss" i], button[aria-label*="back" i], [data-dialog-close]'
          );
          if (closeBtn) {
            closeBtn.click();
          }
        }
      }
    };

    // Ensure focused elements are always scrolled into view
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && target !== document.body) {
        // Smooth scroll into view with generous margins for TV overscan
        target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', handleFocusIn);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocusIn);
    };
  }, [enabled, findNearestFocusable]);
}

export default useTvNavigation;
