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
