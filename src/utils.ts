import type { User } from './types';

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

export const KNOWN_USERS = ['Aaron', 'Electra'] as const;
export const USER_OPTIONS: ReadonlyArray<User> = KNOWN_USERS;

export const isUser = (value: unknown): value is User => USER_OPTIONS.includes(value as User);

export const normalizeUser = (value: unknown): User | null => (isUser(value) ? value : null);

export const parseJsonContent = (content: string, context: string): unknown => {
  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to parse ${context} JSON.`, { cause: error });
  }
};

export const areDeeplyEqual = <T>(left: T, right: T): boolean => {
  try {
    return JSON.stringify(left) === JSON.stringify(right);
  } catch {
    return false;
  }
};

/**
 * Sanitizes input string by removing control characters and trimming whitespace.
 * This helps prevent injection attacks and storage of malformed data.
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '').trim();
};

/**
 * Validates if a string is a safe URL (http/https).
 * This prevents javascript: or data: URLs which can be XSS vectors.
 */
export const isValidUrl = (url: string): boolean => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
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
    const errors = Object.entries(rules).reduce<Record<string, string>>((acc, [field, rule]) => {
      const value = data[field] || '';
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
        acc[field] = `${field} exceeds maximum length of ${rule.maxLength} characters`;
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
    }, {});

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
  data: Record<string, string>
) => {
  const result = validator(data);
  if (!result.isValid) {
    const [firstError] = Object.values(result.errors);
    throw new Error(firstError || 'Validation failed');
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
  fn: (item: T) => Promise<R>
): Promise<R[]> => {
  const results = new Array(items.length);
  const iterator = items.entries();
  const worker = async () => {
    for (const [index, item] of iterator) {
      // eslint-disable-next-line no-await-in-loop
      results[index] = await fn(item);
    }
  };
  await Promise.all(Array.from({ length: Math.min(items.length, concurrency) }, worker));
  return results;
};

/**
 * Returns a shuffled copy of the input without mutating the source array.
 * Accepts an injectable RNG so tests can verify exact ordering.
 */
export const shuffleArray = <T>(items: readonly T[], random: () => number = Math.random): T[] => {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
};
