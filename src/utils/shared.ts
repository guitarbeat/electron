import type { User } from '@/shared/types';

/**
 * Consolidated Utilities
 * Combines security, validation, and concurrency helpers
 */

// ============================================================================
// Security & Validation Constants
// ============================================================================

export const MAX_MESSAGE_LENGTH = 500;
export const MAX_AUTHOR_LENGTH = 50;
export const MAX_MOVIE_TITLE_LENGTH = 200;

export const KNOWN_USERS = ["Aaron", "Electra"] as const;
export const USER_OPTIONS: ReadonlyArray<User> = KNOWN_USERS;

export const isUser = (value: unknown): value is User =>
  USER_OPTIONS.includes(value as User);

export const normalizeUser = (value: unknown): User | null =>
  isUser(value) ? value : null;

export const parseJsonContent = (content: string, context: string): unknown => {
  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to parse ${context} JSON.`, { cause: error });
  }
};

export const areDeeplyEqual = <T>(left: T, right: T): boolean => {
  if (left === right) return true;
  if (left === null || right === null) return left === right;
  if (typeof left !== 'object' || typeof right !== 'object') return false;
  if (Array.isArray(left) !== Array.isArray(right)) return false;

  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) return false;
    return left.every((item, index) => areDeeplyEqual(item, (right as unknown[])[index]));
  }

  const leftObj = left as Record<string, unknown>;
  const rightObj = right as Record<string, unknown>;
  const leftKeys = Object.keys(leftObj);
  const rightKeys = Object.keys(rightObj);
  if (leftKeys.length !== rightKeys.length) return false;
  return leftKeys.every((key) => Object.prototype.hasOwnProperty.call(rightObj, key) && areDeeplyEqual(leftObj[key], rightObj[key]));
};

export const executeAction = (action?: () => void, onComplete?: () => void): void => {
  action?.();
  onComplete?.();
};

export const getErrorMessage = (
  error: unknown,
  fallback: string = "Something went wrong.",
): string => {
  if (error instanceof Error) {
    const message = sanitizeInput(error.message);
    if (message) {
      return message;
    }
  }

  return fallback;
};

export const readApiErrorMessage = async (
  response: Response,
  fallback: string,
): Promise<string> => {
  try {
    const payload = (await response.clone().json()) as { error?: unknown };
    if (typeof payload?.error === "string") {
      const message = sanitizeInput(payload.error);
      if (message) {
        return message;
      }
    }
  } catch {
    // Fall through to the provided fallback.
  }

  return fallback;
};

/**
 * Sanitizes input string by removing control characters and trimming whitespace.
 * This helps prevent injection attacks and storage of malformed data.
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return "";
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "").trim();
};

/**
 * Validates if a string is a safe URL (http/https).
 * This prevents javascript: or data: URLs which can be XSS vectors.
 */
export const isValidUrl = (url: string): boolean => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
};

// ============================================================================
// Validation Framework
// ============================================================================

export interface ValidationRule {
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | null;
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const createValidator = (rules: ValidationRules) => {
  return (data: Record<string, string>): ValidationResult => {
    const errors = Object.entries(rules).reduce<Record<string, string>>(
      (acc, [field, rule]) => {
        const value = data[field] || "";
        const trimmedValue = value.trim();

        if (rule.required && !trimmedValue) {
          acc[field] = `${field} is required`;
          return acc;
        }

        if (!trimmedValue && !rule.required) {
          return acc;
        }

        const cleanValue = sanitizeInput(value);

        if (rule.maxLength && cleanValue.length > rule.maxLength) {
          acc[field] =
            `${field} exceeds maximum length of ${rule.maxLength} characters`;
        }

        if (rule.minLength && cleanValue.length < rule.minLength) {
          acc[field] = `${field} must be at least ${rule.minLength} characters`;
        }

        if (rule.pattern && !rule.pattern.test(cleanValue)) {
          acc[field] = `${field} format is invalid`;
        }

        if (rule.custom) {
          const customError = rule.custom(cleanValue);
          if (customError) {
            acc[field] = customError;
          }
        }

        return acc;
      },
      {},
    );

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  };
};

// Predefined validation rules
const commonValidationRules = {
  movieTitle: {
    required: true,
    maxLength: MAX_MOVIE_TITLE_LENGTH,
  } as ValidationRule,

  messageContent: {
    required: true,
    maxLength: MAX_MESSAGE_LENGTH,
  } as ValidationRule,

  messageAuthor: {
    required: false,
    maxLength: MAX_AUTHOR_LENGTH,
  } as ValidationRule,

  placeName: {
    required: true,
    maxLength: 100,
  } as ValidationRule,

  notes: {
    required: false,
    maxLength: 500,
  } as ValidationRule,
};

export const validatePlace = createValidator({
  name: commonValidationRules.placeName,
  notes: commonValidationRules.notes,
});

export const validateAndThrow = (
  validator: (data: Record<string, string>) => ValidationResult,
  data: Record<string, string>,
) => {
  const result = validator(data);
  if (!result.isValid) {
    const [firstError] = Object.values(result.errors);
    throw new Error(firstError || "Validation failed");
  }
  return result;
};

// ============================================================================
// Concurrency Utilities
// ============================================================================

/**
 * Helper to control concurrency when processing array items
 * @param items The array of items to process
 * @param concurrency The maximum number of concurrent operations
 * @param fn The async function to execute for each item
 * @returns A promise that resolves to an array of results in the same order as the input items
 */
export const concurrentMap = async <T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> => {
  const results = new Array(items.length);
  const iterator = items.entries();
  const worker = async () => {
    for (const [index, item] of iterator) {
      results[index] = await fn(item);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(items.length, concurrency) }, worker),
  );
  return results;
};

export const buildGoogleMapsUrl = (
  apiKey: string,
  libraries: string[],
): string => {
  return `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=${libraries.join(",")}`;
};

/**
 * Normalizes a movie title for comparison purposes (trim + lowercase).
 */
export const normalizeMovieTitle = (title: string): string => title.trim().toLowerCase();

/**
 * Debounce / throttle helpers
 */
export const throttle = <T extends (...args: unknown[]) => unknown>(func: T, limit: number) => {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
  immediate = false,
) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };

    const callNow = immediate && !timeout;

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);

  if (callNow) func.apply(this, args);
  };
};

/**
 * Browser-specific utilities for clipboard access.
 */
export const copyTextToClipboard = async (value: string): Promise<void> => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const fallbackField = document.createElement('textarea');
  fallbackField.value = value;
  fallbackField.setAttribute('readonly', 'true');
  fallbackField.style.position = 'fixed';
  fallbackField.style.opacity = '0';
  fallbackField.style.pointerEvents = 'none';

  document.body.appendChild(fallbackField);
  fallbackField.focus();
  fallbackField.select();

  const didCopy = document.execCommand('copy');
  document.body.removeChild(fallbackField);

  if (!didCopy) {
    throw new Error('Clipboard unavailable');
  }
};

/**
 * Shared date and timestamp formatting utilities.
 */

/**
 * Formats a message timestamp as a short time (e.g. "3:45 PM") for messages sent
 * today, or as a short date (e.g. "Jan 5") for older messages.
 */
export const formatMessageTimestamp = (date: string): string => {
  try {
    const timestamp = new Date(date);
    const now = new Date();

    if (Number.isNaN(timestamp.getTime()) || Number.isNaN(now.getTime())) {
      return '';
    }

    const diffSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);

    if (diffSeconds < 0) {
      return '';
    }

    if (diffSeconds < 86400) {
      const hours = timestamp.getHours();
      const minutes = timestamp.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    }

    return timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
};

/**
 * Formats a memory/record timestamp as a full date-time string
 * (e.g. "Jan 5, 2025, 3:45 PM").
 */
export const formatMemoryTimestamp = (createdAt: string): string => {
  const parsedDate = new Date(createdAt);
  if (Number.isNaN(parsedDate.getTime())) {
    return 'Unknown date';
  }

  return parsedDate.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

/**
 * Seeded random number generator for consistent results across renders
 */
export class SeededRandom {
  private seed: number;

  constructor(seed: number = Date.now()) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextFloat(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.nextFloat(min, max));
  }

  nextBoolean(): boolean {
    return this.next() > 0.5;
  }

  nextArrayItem<T>(array: T[]): T {
    return array[this.nextInt(0, array.length)];
  }

  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

// Global seeded random instance for consistent animations
export const animationRandom = new SeededRandom(12345);

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
