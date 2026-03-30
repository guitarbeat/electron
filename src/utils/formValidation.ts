/**
 * Common form validation utilities
 */

export interface ValidationRule {
  validate: (value: string) => boolean;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export class FormValidator {
  private rules: ValidationRule[] = [];

  addRule(rule: ValidationRule): this {
    this.rules.push(rule);
    return this;
  }

  validate(value: string): ValidationResult {
    for (const rule of this.rules) {
      if (!rule.validate(value)) {
        return { isValid: false, message: rule.message };
      }
    }
    return { isValid: true };
  }

  static lengthRule(min: number, max?: number): ValidationRule {
    return {
      validate: (value) => {
        const length = value.length;
        if (max) {
          return length >= min && length <= max;
        }
        return length >= min;
      },
      message: max 
        ? `Must be between ${min} and ${max} characters`
        : `Must be at least ${min} characters`,
    };
  }

  static exactLengthRule(length: number): ValidationRule {
    return {
      validate: (value) => value.length === length,
      message: `Must be exactly ${length} characters`,
    };
  }

  static numericRule(): ValidationRule {
    return {
      validate: (value) => /^\d+$/.test(value),
      message: 'Must contain only numbers',
    };
  }

  static requiredRule(): ValidationRule {
    return {
      validate: (value) => value.trim().length > 0,
      message: 'This field is required',
    };
  }

  static emailRule(): ValidationRule {
    return {
      validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message: 'Must be a valid email address',
    };
  }
}


/**
 * Hook-like utility for managing form state with validation
 */
export interface FormField<T = string> {
  value: T;
  error?: string;
  isValid: boolean;
  isDirty: boolean;
}

export class FormManager<T extends Record<string, string | number | boolean>> {
  private fields: Record<keyof T, FormField<string | number | boolean>>;
  private validators: Record<keyof T, FormValidator>;

  constructor(
    initialValues: T,
    fieldValidators: Record<keyof T, FormValidator>
  ) {
    this.validators = fieldValidators;
    this.fields = {} as Record<keyof T, FormField<string | number | boolean>>;
    
    for (const key in initialValues) {
      this.fields[key] = {
        value: initialValues[key],
        isValid: true,
        isDirty: false,
      };
    }
  }

  setValue<K extends keyof T>(field: K, value: T[K]): void {
    const currentField = this.fields[field];
    currentField.value = value;
    currentField.isDirty = true;
    
    const validator = this.validators[field];
    if (validator) {
      const result = validator.validate(String(value));
      currentField.isValid = result.isValid;
      currentField.error = result.isValid ? undefined : result.message;
    }
  }

  getValue<K extends keyof T>(field: K): T[K] {
    return this.fields[field].value as T[K];
  }

  getField<K extends keyof T>(field: K): FormField<string | number | boolean> {
    return this.fields[field];
  }

  isFormValid(): boolean {
    return Object.values(this.fields).every(field => field.isValid);
  }

  getValues(): T {
    const result = {} as T;
    for (const key in this.fields) {
      result[key] = this.fields[key].value as T[Extract<keyof T, string>];
    }
    return result;
  }

  reset(): void {
    for (const field in this.fields) {
      this.fields[field].isDirty = false;
      this.fields[field].error = undefined;
      this.fields[field].isValid = true;
    }
  }
}
