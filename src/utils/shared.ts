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
  const check = (left: unknown, right: unknown, visited = new WeakMap<object, object>()): boolean => {
    if (left === right) return true;
    if (left === null || right === null) return left === right;
    if (typeof left !== 'object' || typeof right !== 'object') return false;
    if (Array.isArray(left) !== Array.isArray(right)) return false;

    const leftObjOrArr = left as object;
    const rightObjOrArr = right as object;

    if (visited.has(leftObjOrArr)) {
      return visited.get(leftObjOrArr) === rightObjOrArr;
    }
    visited.set(leftObjOrArr, rightObjOrArr);

    let result = false;

    if (Array.isArray(left) && Array.isArray(right)) {
      if (left.length !== right.length) {
        visited.delete(leftObjOrArr);
        return false;
      }
      result = left.every((item, index) => check(item, (right as unknown[])[index], visited));
    } else {
      const leftObj = left as Record<string, unknown>;
      const rightObj = right as Record<string, unknown>;
      const leftKeys = Object.keys(leftObj);
      const rightKeys = Object.keys(rightObj);
      if (leftKeys.length !== rightKeys.length) {
        visited.delete(leftObjOrArr);
        return false;
      }
      result = leftKeys.every((key) => Object.prototype.hasOwnProperty.call(rightObj, key) && check(leftObj[key], rightObj[key], visited));
    }

    visited.delete(leftObjOrArr);
    return result;
  };

  return check(left, right);
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
