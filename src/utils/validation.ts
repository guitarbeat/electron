/**
 * Validation Framework
 * Provides reusable validation rules and utilities
 */

import { sanitizeInput } from './shared';

// ============================================================================
// Validation Constants
// ============================================================================

export const MAX_MESSAGE_LENGTH = 500;
export const MAX_AUTHOR_LENGTH = 50;
export const MAX_MOVIE_TITLE_LENGTH = 200;

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationRule {
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | null;
  message?: string; // Custom error message for the rule
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  fieldErrors: string[]; // Array of error messages for easier display
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Creates a reusable validator function based on defined rules
 * @param rules Validation rules object with field names as keys
 * @returns Validator function that takes data and returns validation result
 */
export const createValidator = (rules: ValidationRules) => {
  return (data: Record<string, unknown>): ValidationResult => {
    const errors: Record<string, string> = {};
    const fieldErrors: string[] = [];

    Object.entries(rules).forEach(([field, rule]) => {
      const rawValue = data[field];
      const value = typeof rawValue === 'string' ? rawValue : String(rawValue || '');
      const trimmedValue = value.trim();

      // Required validation
      if (rule.required && !trimmedValue) {
        const error = rule.message || `${field} is required`;
        errors[field] = error;
        fieldErrors.push(error);
        return;
      }

      // Skip other validations if field is empty and not required
      if (!trimmedValue && !rule.required) {
        return;
      }

      const cleanValue = value.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "").trim();

      // Max length validation
      if (rule.maxLength && cleanValue.length > rule.maxLength) {
        const error = rule.message || 
          `${field} exceeds maximum length of ${rule.maxLength} characters`;
        errors[field] = error;
        fieldErrors.push(error);
      }

      // Min length validation
      if (rule.minLength && cleanValue.length < rule.minLength) {
        const error = rule.message || 
          `${field} must be at least ${rule.minLength} characters`;
        errors[field] = error;
        fieldErrors.push(error);
      }

      // Pattern validation
      if (rule.pattern && !rule.pattern.test(cleanValue)) {
        const error = rule.message || `${field} format is invalid`;
        errors[field] = error;
        fieldErrors.push(error);
      }

      // Custom validation
      if (rule.custom) {
        const customError = rule.custom(cleanValue);
        if (customError) {
          errors[field] = customError;
          fieldErrors.push(customError);
        }
      }
    });

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      fieldErrors,
    };
  };
};

// ============================================================================
// Common Validation Patterns
// ============================================================================

/**
 * Common validation patterns for reuse
 */
export const ValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^https?:\/\/.+/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  numeric: /^\d+$/,
  phone: /^\+?[\d\s\-\(\)]+$/,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
} as const;

// ============================================================================
// Predefined Validation Rules
// ============================================================================

/**
 * Predefined validation rules for common use cases
 */
export const CommonRules = {
  required: { required: true },
  email: { 
    required: true, 
    pattern: ValidationPatterns.email,
    message: 'Please enter a valid email address'
  },
  url: { 
    pattern: ValidationPatterns.url,
    message: 'Please enter a valid URL starting with http:// or https://'
  },
  username: {
    required: true,
    minLength: 3,
    maxLength: 20,
    pattern: ValidationPatterns.alphanumeric,
    message: 'Username must be 3-20 alphanumeric characters'
  },
  password: {
    required: true,
    minLength: 8,
    message: 'Password must be at least 8 characters long'
  },
  movieTitle: {
    required: true,
    maxLength: MAX_MOVIE_TITLE_LENGTH,
    message: `Movie title must be ${MAX_MOVIE_TITLE_LENGTH} characters or less`
  },
  messageContent: {
    required: true,
    maxLength: MAX_MESSAGE_LENGTH,
    message: `Message must be ${MAX_MESSAGE_LENGTH} characters or less`
  },
  messageAuthor: {
    required: false,
    maxLength: MAX_AUTHOR_LENGTH,
    message: `Author name must be ${MAX_AUTHOR_LENGTH} characters or less`
  },
  placeName: {
    required: true,
    maxLength: 100,
    message: 'Place name must be 100 characters or less'
  },
  notes: {
    required: false,
    maxLength: 500,
    message: 'Notes must be 500 characters or less'
  },
} as const;

// ============================================================================
// Predefined Validators
// ============================================================================

export const validatePlace = createValidator({
  name: CommonRules.placeName,
  notes: CommonRules.notes,
});

export const validateMemory = createValidator({
  note: {
    required: true,
    maxLength: 500,
    custom: (value) => {
      // Check for @mentions of valid users
      const mentions = value.match(/(@\w+)/g);
      if (mentions) {
        const invalidMentions = mentions.filter(mention => 
          !['@aaron', '@electra'].includes(mention.toLowerCase())
        );
        if (invalidMentions.length > 0) {
          return `Invalid mentions: ${invalidMentions.join(', ')}. Only @aaron and @electra are allowed.`;
        }
      }
      return null;
    },
  } as ValidationRule,
  
  movieTitle: {
    required: true,
    maxLength: MAX_MOVIE_TITLE_LENGTH,
  } as ValidationRule,
  
  author: {
    required: true,
    maxLength: MAX_AUTHOR_LENGTH,
  } as ValidationRule,
});

export const validateAndThrow = (
  validator: (data: Record<string, unknown>) => ValidationResult,
  data: Record<string, unknown>,
): ValidationResult => {
  const result = validator(data);
  if (!result.isValid) {
    const [firstError] = Object.values(result.errors);
    throw new Error(firstError || "Validation failed");
  }
  return result;
};
