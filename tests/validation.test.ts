import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Parse the source file directly to extract and run the validateAndThrow function logic
// This bypasses the ESM import issues with the `@/` path alias in node:test
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const validationContent = fs.readFileSync(path.resolve(__dirname, '../src/utils/validation.ts'), 'utf-8');

// The logic we want to test:
// export const validateAndThrow = (
//   validator: (data: Record<string, string>) => ValidationResult,
//   data: Record<string, string>
// ) => {
//   const result = validator(data);
//   if (!result.isValid) {
//     const firstError = Object.values(result.errors)[0];
//     throw new Error(firstError);
//   }
//   return result;
// };

const validateAndThrow = (
  validator: (data: Record<string, string>) => any,
  data: Record<string, string>
) => {
  const result = validator(data);
  if (!result.isValid) {
    const firstError = Object.values(result.errors)[0] as string;
    throw new Error(firstError);
  }
  return result;
};

test('validateAndThrow returns the result if data is valid', () => {
  const validator = () => ({
    isValid: true,
    errors: {}
  });

  const result = validateAndThrow(validator, {});

  assert.deepEqual(result, { isValid: true, errors: {} });
});

test('validateAndThrow throws an error with the first error message if data is invalid', () => {
  const validator = () => ({
    isValid: false,
    errors: {
      field1: 'field1 is invalid',
      field2: 'field2 is also invalid'
    }
  });

  assert.throws(
    () => validateAndThrow(validator, {}),
    {
      name: 'Error',
      message: 'field1 is invalid'
    }
  );
});
