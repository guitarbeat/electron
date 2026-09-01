/**
 * Random & Array Math Utilities
 */

/**
 * Cryptographically secure pseudo-random number generator
 * Returns a floating-point, pseudo-random number between 0 (inclusive) and 1 (exclusive).
 */
export const getSecureRandom = (): number => {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] / (0xffffffff + 1);
  }
  return Math.random();
};

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const shallowCloneArray = <T>(arr: T[]): T[] => [...arr];

export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(getSecureRandom() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const randomUtils = {
  /**
   * Get random item from array using secure random
   */
  randomItem: <T>(array: T[]): T => {
    return array[Math.floor(getSecureRandom() * array.length)];
  },

  /**
   * Get random number in range
   */
  randomRange: (min: number, max: number): number => {
    return min + getSecureRandom() * (max - min);
  },

  /**
   * Get random integer in range
   */
  randomInt: (min: number, max: number): number => {
    return Math.floor(min + getSecureRandom() * (max - min));
  },

  /**
   * Get random boolean
   */
  randomBool: (): boolean => getSecureRandom() > 0.5,

  /**
   * Generate confetti particle properties
   */
  generateConfettiParticle: (id: number, colors: string[]) => ({
    id,
    x: getSecureRandom() * 100,
    color: randomUtils.randomItem(colors),
    delay: getSecureRandom() * 0.5,
    rotation: getSecureRandom() * 360,
    scale: 0.5 + getSecureRandom() * 0.5,
    isRounded: randomUtils.randomBool(),
  }),

  /**
   * Generate star particle for cursor trail
   */
  generateCursorStar: (x: number, y: number, id: number) => ({
    id,
    x,
    y,
    opacity: 1,
    scale: 0.5 + getSecureRandom(),
  }),
};
