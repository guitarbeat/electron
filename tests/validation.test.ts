import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createValidator,
  validateAndThrow,
  type ValidationRules,
} from '../src/utils/validation.ts';

test('createValidator - required validation', () => {
  const rules: ValidationRules = {
    username: { required: true },
  };
  const validate = createValidator(rules);

  const result1 = validate({ username: '  ' });
  assert.equal(result1.isValid, false);
  assert.equal(result1.errors.username, 'username is required');

  const result2 = validate({ username: 'john_doe' });
  assert.equal(result2.isValid, true);
  assert.deepEqual(result2.errors, {});
});

test('createValidator - optional field', () => {
  const rules: ValidationRules = {
    nickname: { required: false, minLength: 3 },
  };
  const validate = createValidator(rules);

  const result1 = validate({ nickname: '' });
  assert.equal(result1.isValid, true);

  const result2 = validate({ nickname: 'ab' });
  assert.equal(result2.isValid, false);
});

test('createValidator - maxLength', () => {
  const rules: ValidationRules = {
    title: { maxLength: 5 },
  };
  const validate = createValidator(rules);

  const result1 = validate({ title: '123456' });
  assert.equal(result1.isValid, false);
  assert.equal(result1.errors.title, 'title exceeds maximum length of 5 characters');

  const result2 = validate({ title: '12345' });
  assert.equal(result2.isValid, true);
});

test('createValidator - minLength', () => {
  const rules: ValidationRules = {
    password: { minLength: 4 },
  };
  const validate = createValidator(rules);

  const result1 = validate({ password: '123' });
  assert.equal(result1.isValid, false);
  assert.equal(result1.errors.password, 'password must be at least 4 characters');

  const result2 = validate({ password: '1234' });
  assert.equal(result2.isValid, true);
});

test('createValidator - pattern', () => {
  const rules: ValidationRules = {
    email: { pattern: /^[^@]+@[^@]+\.[^@]+$/ },
  };
  const validate = createValidator(rules);

  const result1 = validate({ email: 'invalid-email' });
  assert.equal(result1.isValid, false);
  assert.equal(result1.errors.email, 'email format is invalid');

  const result2 = validate({ email: 'test@example.com' });
  assert.equal(result2.isValid, true);
});

test('createValidator - custom', () => {
  const rules: ValidationRules = {
    age: { custom: (val) => (parseInt(val, 10) < 18 ? 'Must be 18 or older' : null) },
  };
  const validate = createValidator(rules);

  const result1 = validate({ age: '17' });
  assert.equal(result1.isValid, false);
  assert.equal(result1.errors.age, 'Must be 18 or older');

  const result2 = validate({ age: '18' });
  assert.equal(result2.isValid, true);
});

test('validateAndThrow - fails', () => {
  const rules: ValidationRules = {
    name: { required: true },
  };
  const validate = createValidator(rules);

  assert.throws(
    () => validateAndThrow(validate, { name: '' }),
    (err: Error) => err.message === 'name is required'
  );
});

test('validateAndThrow - success', () => {
  const rules: ValidationRules = {
    name: { required: true },
  };
  const validate = createValidator(rules);

  const result = validateAndThrow(validate, { name: 'Alice' });
  assert.equal(result.isValid, true);
});
