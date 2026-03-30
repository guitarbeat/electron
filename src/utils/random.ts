/**
 * Random utility functions
 */

/**
 * Fisher-Yates shuffle algorithm
 * @param array The array to shuffle
 * @returns A new shuffled array
 */
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Generate a random integer between min and max (inclusive)
 */
export const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Generate a random float between min and max
 */
export const randomFloat = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

/**
 * Pick a random element from an array
 */
export const randomChoice = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

export const randomUtils = {
  shuffleArray,
  randomInt,
  randomFloat,
  randomChoice,
};
