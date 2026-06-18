export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** True on devices that support hover (typically mouse/trackpad). */
export const hasHoverCapability = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(hover: hover)").matches;

/** True on devices with a precise pointing device. */
export const hasFinePointer = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(pointer: fine)").matches;

export const isChromaSpotlightEnabled = (): boolean =>
  !prefersReducedMotion() && hasHoverCapability();

/** Subscribe to motion/hover preference changes. Returns an unsubscribe function. */
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
