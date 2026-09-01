import { sanitizeInput } from "./security.js";

// ============================================================================
// Validation Constants & Utilities
// ============================================================================

export const MAX_MESSAGE_LENGTH = 500;
export const MAX_AUTHOR_LENGTH = 50;
export const MAX_MOVIE_TITLE_LENGTH = 200;

export interface ValidationRule {
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | null;
  message?: string;
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  fieldErrors: string[];
}

export const createValidator = (rules: ValidationRules) => {
  return (data: Record<string, unknown>): ValidationResult => {
    const errors: Record<string, string> = {};
    const fieldErrors: string[] = [];

    Object.entries(rules).forEach(([field, rule]) => {
      const rawValue = data[field];
      const value =
        typeof rawValue === "string" ? rawValue : String(rawValue || "");
      const trimmedValue = value.trim();

      if (rule.required && !trimmedValue) {
        const error = rule.message || `${field} is required`;
        errors[field] = error;
        fieldErrors.push(error);
        return;
      }

      if (!trimmedValue && !rule.required) {
        return;
      }

      const cleanValue = sanitizeInput(value);

      if (rule.maxLength && cleanValue.length > rule.maxLength) {
        const error =
          rule.message ||
          `${field} exceeds maximum length of ${rule.maxLength} characters`;
        errors[field] = error;
        fieldErrors.push(error);
      }

      if (rule.minLength && cleanValue.length < rule.minLength) {
        const error =
          rule.message ||
          `${field} must be at least ${rule.minLength} characters`;
        errors[field] = error;
        fieldErrors.push(error);
      }

      if (rule.pattern && !rule.pattern.test(cleanValue)) {
        const error = rule.message || `${field} format is invalid`;
        errors[field] = error;
        fieldErrors.push(error);
      }

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

export const ValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^https?:\/\/.+/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  numeric: /^\d+$/,
  phone: /^\+?[\d\s\-()]+$/,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
} as const;

export const CommonRules = {
  required: { required: true },
  email: {
    required: true,
    pattern: ValidationPatterns.email,
    message: "Please enter a valid email address",
  },
  url: {
    pattern: ValidationPatterns.url,
    message: "Please enter a valid URL starting with http:// or https://",
  },
  username: {
    required: true,
    minLength: 3,
    maxLength: 20,
    pattern: ValidationPatterns.alphanumeric,
    message: "Username must be 3-20 alphanumeric characters",
  },
  password: {
    required: true,
    minLength: 8,
    message: "Password must be at least 8 characters long",
  },
  movieTitle: {
    required: true,
    maxLength: MAX_MOVIE_TITLE_LENGTH,
    message: `Movie title must be ${MAX_MOVIE_TITLE_LENGTH} characters or less`,
  },
  messageContent: {
    required: true,
    maxLength: MAX_MESSAGE_LENGTH,
    message: `Message must be ${MAX_MESSAGE_LENGTH} characters or less`,
  },
  messageAuthor: {
    required: false,
    maxLength: MAX_AUTHOR_LENGTH,
    message: `Author name must be ${MAX_AUTHOR_LENGTH} characters or less`,
  },
  placeName: {
    required: true,
    maxLength: 100,
    message: "Place name must be 100 characters or less",
  },
  notes: {
    required: false,
    maxLength: 500,
    message: "Notes must be 500 characters or less",
  },
} as const;

export const validatePlace = createValidator({
  name: CommonRules.placeName,
  notes: CommonRules.notes,
});

export const validateMemory = createValidator({
  note: {
    required: true,
    maxLength: 500,
    custom: (value) => {
      const mentions = value.match(/(@\w+)/g);
      if (mentions) {
        const invalidMentions = mentions.filter(
          (mention) => !["@aaron", "@electra"].includes(mention.toLowerCase()),
        );
        if (invalidMentions.length > 0) {
          return `Invalid mentions: ${invalidMentions.join(", ")}. Only @aaron and @electra are allowed.`;
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
