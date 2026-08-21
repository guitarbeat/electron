import { useEffect } from "react";

/**
 * Spatial navigation and audio unlock hook for TV remote D-Pad controls.
 */
export function useTvSpatialNavigation(isTvEnabled: boolean = true) {
  useEffect(() => {
    if (typeof window === "undefined" || !isTvEnabled) return;

    // Helper to attempt unlocking Web Audio AudioContext on remote input
    const unlockAudio = () => {
      const audioCtx = (window as unknown as { _sharedAudioContext?: AudioContext })._sharedAudioContext;
      if (audioCtx && audioCtx.state === "suspended") {
        audioCtx.resume().catch(() => {});
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      unlockAudio();

      const navigationKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
      if (!navigationKeys.includes(e.key)) return;

      const active = document.activeElement as HTMLElement | null;

      // If user is inside a text input or textarea, let default text editing work
      if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          return;
        }
      }

      const focusableSelector =
        'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"]), .ups-card, .card-tilt-wrap';
      const elements = Array.from(
        document.querySelectorAll<HTMLElement>(focusableSelector)
      ).filter((el) => {
        const style = window.getComputedStyle(el);
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          el.offsetWidth > 0 &&
          el.offsetHeight > 0
        );
      });

      if (elements.length === 0) return;

      if (!active || !elements.includes(active)) {
        elements[0].focus();
        e.preventDefault();
        return;
      }

      const currentRect = active.getBoundingClientRect();
      const currentCenterX = currentRect.left + currentRect.width / 2;
      const currentCenterY = currentRect.top + currentRect.height / 2;

      let bestNext: HTMLElement | null = null;
      let minDistance = Infinity;

      elements.forEach((el) => {
        if (el === active) return;
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = centerX - currentCenterX;
        const dy = centerY - currentCenterY;

        let isValidDirection = false;
        switch (e.key) {
          case "ArrowUp":
            isValidDirection = dy < -5;
            break;
          case "ArrowDown":
            isValidDirection = dy > 5;
            break;
          case "ArrowLeft":
            isValidDirection = dx < -5;
            break;
          case "ArrowRight":
            isValidDirection = dx > 5;
            break;
        }

        if (isValidDirection) {
          const distance = Math.hypot(dx, dy);
          if (distance < minDistance) {
            minDistance = distance;
            bestNext = el;
          }
        }
      });

      if (bestNext) {
        (bestNext as HTMLElement).focus();
        (bestNext as HTMLElement).scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest",
        });
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isTvEnabled]);
}
