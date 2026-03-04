import { sanitizeInput, MAX_MOVIE_TITLE_LENGTH, MAX_MESSAGE_LENGTH, MAX_AUTHOR_LENGTH } from '../config/security';

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
    const errors: Record<string, string> = {};

    for (const [field, rule] of Object.entries(rules)) {
      const value = data[field] || '';

      // Required validation
      if (rule.required && !value.trim()) {
        errors[field] = `${field} is required`;
        continue;
      }

      // Skip other validations if field is empty and not required
      if (!value.trim() && !rule.required) {
        continue;
      }

      const cleanValue = sanitizeInput(value);

      // Length validations
      if (rule.maxLength && cleanValue.length > rule.maxLength) {
        errors[field] = `${field} exceeds maximum length of ${rule.maxLength} characters`;
      }

      if (rule.minLength && cleanValue.length < rule.minLength) {
        errors[field] = `${field} must be at least ${rule.minLength} characters`;
      }

      // Pattern validation
      if (rule.pattern && !rule.pattern.test(cleanValue)) {
        errors[field] = `${field} format is invalid`;
      }

      // Custom validation
      if (rule.custom) {
        const customError = rule.custom(cleanValue);
        if (customError) {
          errors[field] = customError;
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  };
};

// Predefined validation rules
export const commonValidationRules = {
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

// Predefined validators
export const validateMovieTitle = createValidator({
  title: commonValidationRules.movieTitle,
});

export const validateMessage = createValidator({
  content: commonValidationRules.messageContent,
  author: commonValidationRules.messageAuthor,
});

export const validatePlace = createValidator({
  name: commonValidationRules.placeName,
  notes: commonValidationRules.notes,
});

// Utility function to validate and throw errors
export const validateAndThrow = (validator: (data: Record<string, string>) => ValidationResult, data: Record<string, string>) => {
  const result = validator(data);
  if (!result.isValid) {
    const firstError = Object.values(result.errors)[0];
    throw new Error(firstError);
  }
  return result;
};
