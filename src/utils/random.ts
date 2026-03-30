/**
 * Utility functions for common random patterns
 */
export const randomUtils = {
  /**
   * Get random item from array using seeded random for animations
   */
  randomItem: <T>(array: T[]): T => {
    return array[Math.floor(Math.random() * array.length)];
  },

  /**
   * Get random number in range
   */
  randomRange: (min: number, max: number): number => {
    return min + Math.random() * (max - min);
  },

  /**
   * Get random integer in range
   */
  randomInt: (min: number, max: number): number => {
    return Math.floor(min + Math.random() * (max - min));
  },

  /**
   * Get random boolean
   */
  randomBool: (): boolean => Math.random() > 0.5,

  /**
   * Generate confetti particle properties
   */
  generateConfettiParticle: (id: number, colors: string[]) => ({
    id,
    x: Math.random() * 100,
    color: randomUtils.randomItem(colors),
    delay: Math.random() * 0.5,
    rotation: Math.random() * 360,
    scale: 0.5 + Math.random() * 0.5,
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
    scale: 0.5 + Math.random(),
  }),

  /**
   * Generate food spawn properties
   */
  generateFoodSpawn: (boardWidth: number, foodSize: number, fruitList: string[], maxIndex: number) => ({
    id: crypto.randomUUID(),
    x: Math.random() * (boardWidth - foodSize),
    y: -foodSize,
    speed: 2 + Math.random() * 2,
    fruit: randomUtils.randomItem(fruitList.slice(0, maxIndex)),
  }),
};

/**
 * Math and array utilities
 */

/**
 * Clamps a number between a min and max value.
 */
export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/**
 * Returns a random number between min (inclusive) and max (exclusive).
 */
export const randomBetween = (min: number, max: number): number =>
  min + Math.random() * (max - min);

/**
 * Returns a shallow clone of an array of objects.
 */
export const shallowCloneArray = <T extends object>(arr: T[]): T[] =>
  arr.map((item) => ({ ...item }));

/**
 * Returns a shuffled copy of the input without mutating the source array.
 * Accepts an injectable RNG so tests can verify exact ordering.
 */
export const shuffleArray = <T>(
  items: readonly T[],
  random: () => number = Math.random,
): T[] => {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }

  return shuffled;
};
