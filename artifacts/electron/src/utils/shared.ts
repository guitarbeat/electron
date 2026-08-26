import type { Movie, User } from "../shared/types.ts";
import { spacing } from "../theme/tokens.ts";

/**
 * Consolidated Utilities
 * Combines security, concurrency, and core utilities
 */

// ============================================================================
// Security Constants
// ============================================================================

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

export const deepClone = <T>(value: T): T => {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
};

export const areDeeplyEqual = <T>(left: T, right: T): boolean => {
  if (left === right) return true;
  if (left === null || right === null) return left === right;
  if (typeof left !== "object" || typeof right !== "object") return false;
  if (Array.isArray(left) !== Array.isArray(right)) return false;

  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) return false;
    return left.every((item, index) =>
      areDeeplyEqual(item, (right as unknown[])[index]),
    );
  }

  const leftObj = left as Record<string, unknown>;
  const rightObj = right as Record<string, unknown>;
  const leftKeys = Object.keys(leftObj);
  const rightKeys = Object.keys(rightObj);
  if (leftKeys.length !== rightKeys.length) return false;
  return leftKeys.every(
    (key) =>
      Object.prototype.hasOwnProperty.call(rightObj, key) &&
      areDeeplyEqual(leftObj[key], rightObj[key]),
  );
};

export const executeAction = (
  action?: () => void,
  onComplete?: () => void,
): void => {
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

/**
 * Log error with extra info if available (status, code, etc)
 */
export const consoleError = (
  message: string,
  error: unknown,
  context?: Record<string, unknown>,
): void => {
  const details =
    error && typeof error === "object"
      ? {
          status: (error as Record<string, unknown>).status,
          code: (error as Record<string, unknown>).code,
          conflict: (error as Record<string, unknown>).conflict,
          ...context,
        }
      : context;

  const hasDetails =
    details && Object.values(details).some((v) => v !== undefined);
  if (hasDetails) {
    console.error(message, error, details);
  } else {
    console.error(message, error);
  }
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
export const sanitizeInput = (input: string | null | undefined): string => {
  if (!input) return "";
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

/**
 * Encodes data for storage to prevent direct plaintext access in localStorage.
 * Uses a version prefix for future extensibility and Base64 for basic obfuscation.
 */
export const encodeStorageData = (data: string): string => {
  try {
    return `v1:${btoa(data)}`;
  } catch {
    return data;
  }
};

/**
 * Decodes data from storage. Supports both legacy plaintext and versioned encoded formats.
 */
export const decodeStorageData = (data: string): string => {
  if (!data || !data.startsWith("v1:")) {
    return data;
  }

  try {
    const encodedPart = data.substring(3);
    // Basic regex check for Base64 characters
    if (!/^[a-zA-Z0-9+/=]*$/.test(encodedPart)) {
      return data;
    }
    return atob(encodedPart);
  } catch {
    return data;
  }
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
  if (items.length === 0) {
    return [];
  }

  const results = new Array<R>(items.length);
  let currentIndex = 0;
  let hasError = false;

  const worker = async () => {
    while (!hasError) {
      const index = currentIndex++;
      if (index >= items.length) {
        break;
      }
      try {
        results[index] = await fn(items[index]);
      } catch (error) {
        hasError = true;
        throw error;
      }
    }
  };

  // Start workers
  const workers = Array.from(
    { length: Math.min(items.length, concurrency) },
    worker,
  );

  await Promise.all(workers);
  return results;
};

// ============================================================================
// Utility Functions
// ============================================================================

export const normalizeMovieTitle = (title: string): string =>
  title.trim().toLowerCase().replace(/\s+/g, " ");

export const findMovieByNormalizedTitle = (
  movies: readonly Movie[],
  title: string,
): Movie | undefined => {
  const normalized = normalizeMovieTitle(title);
  return movies.find(
    (movie) => normalizeMovieTitle(movie.title) === normalized,
  );
};

export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number,
) => {
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

export const copyTextToClipboard = async (value: string): Promise<void> => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const fallbackField = document.createElement("textarea");
  fallbackField.value = value;
  fallbackField.setAttribute("readonly", "true");
  fallbackField.style.position = "fixed";
  fallbackField.style.opacity = "0";
  fallbackField.style.pointerEvents = "none";

  document.body.appendChild(fallbackField);
  fallbackField.focus();
  fallbackField.select();

  const didCopy = document.execCommand("copy");
  document.body.removeChild(fallbackField);

  if (!didCopy) {
    throw new Error("Clipboard unavailable");
  }
};

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const shallowCloneArray = <T>(arr: T[]): T[] =>
  [...arr];

export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(getSecureRandom() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// ============================================================================
// Date Utilities
// ============================================================================

/**
 * Formats a message timestamp as a short time (e.g. "3:45 PM") for messages sent
 * today, or as a short date (e.g. "Jan 5") for older messages.
 */
export const formatMessageTimestamp = (date: string): string => {
  try {
    const timestamp = new Date(date);
    const now = new Date();

    if (Number.isNaN(timestamp.getTime()) || Number.isNaN(now.getTime())) {
      return "";
    }

    const diffSeconds = Math.floor(
      (now.getTime() - timestamp.getTime()) / 1000,
    );

    if (diffSeconds < 0) {
      return "";
    }

    if (diffSeconds < 86400) {
      const hours = timestamp.getHours();
      const minutes = timestamp.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
    }

    return timestamp.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
};

/**
 * Formats a memory/record timestamp as a full date-time string
 * (e.g. "Jan 5, 2025, 3:45 PM").
 */
export const formatMemoryTimestamp = (createdAt: string): string => {
  const parsedDate = new Date(createdAt);
  if (Number.isNaN(parsedDate.getTime())) {
    return "Unknown date";
  }

  return parsedDate.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

// ============================================================================
// Random Utilities
// ============================================================================

/**
 * Utility functions for common random patterns
 */

/**
 * Cryptographically secure pseudo-random number generator
 * Returns a floating-point, pseudo-random number between 0 (inclusive) and 1 (exclusive).
 */
export const getSecureRandom = (): number => {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] / (0xffffffff + 1);
};

export const randomUtils = {
  /**
   * Get random item from array using seeded random for animations
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

  /**
   * Generate food spawn properties
   */
  generateFoodSpawn: (
    boardWidth: number,
    foodSize: number,
    fruitList: string[],
    maxIndex: number,
  ) => ({
    id: crypto.randomUUID(),
    x: getSecureRandom() * (boardWidth - foodSize),
    y: -foodSize,
    speed: 2 + getSecureRandom() * 2,
    fruit: randomUtils.randomItem(fruitList.slice(0, maxIndex)),
  }),
};

// ============================================================================
// Layout Utilities
// ============================================================================

export const layouts = {
  centeredContainer: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: `0 ${spacing.md}`,
  },
  grid: (columns: number = 1, gap: string = spacing.md) => ({
    display: "grid",
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap,
  }),
  stack: (gap: string = spacing.md) => ({
    display: "flex",
    flexDirection: "column" as const,
    gap,
  }),
  inlineStack: (gap: string = spacing.md) => ({
    display: "flex",
    alignItems: "center",
    gap,
  }),
  flexRow: (
    justifyContent: string = "flex-start",
    alignItems: string = "center",
    gap: string = spacing.md,
  ) => ({
    display: "flex",
    flexDirection: "row" as const,
    justifyContent,
    alignItems,
    gap,
  }),
  flexColumn: (
    justifyContent: string = "flex-start",
    alignItems: string = "stretch",
    gap: string = spacing.md,
  ) => ({
    display: "flex",
    flexDirection: "column" as const,
    justifyContent,
    alignItems,
    gap,
  }),
  spaceBetween: (
    direction: "row" | "column" = "row",
    gap: string = spacing.md,
  ) => ({
    display: "flex",
    flexDirection: direction,
    justifyContent: "space-between",
    alignItems: direction === "row" ? "center" : "stretch",
    gap,
  }),
};
