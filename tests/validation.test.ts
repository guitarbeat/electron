import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createValidator,
  validateAndThrow,
  type ValidationRules,
} from '../src/utils/validation.ts';

test('createValidator enforces required fields', () => {
  const rules: ValidationRules = {
    username: { required: true },
  };
  const validate = createValidator(rules);

  const missing = validate({ username: '  ' });
  assert.equal(missing.isValid, false);
  assert.equal(missing.errors.username, 'username is required');

  const present = validate({ username: 'john_doe' });
  assert.equal(present.isValid, true);
  assert.deepEqual(present.errors, {});
});

test('createValidator skips optional empty fields', () => {
  const rules: ValidationRules = {
    nickname: { required: false, minLength: 3 },
  };
  const validate = createValidator(rules);

  const empty = validate({ nickname: '' });
  assert.equal(empty.isValid, true);

  const short = validate({ nickname: 'ab' });
  assert.equal(short.isValid, false);
  assert.equal(short.errors.nickname, 'nickname must be at least 3 characters');
});

test('createValidator enforces maximum length', () => {
  const rules: ValidationRules = {
    title: { maxLength: 5 },
  };
  const validate = createValidator(rules);

  const tooLong = validate({ title: '123456' });
  assert.equal(tooLong.isValid, false);
  assert.equal(tooLong.errors.title, 'title exceeds maximum length of 5 characters');

  const valid = validate({ title: '12345' });
  assert.equal(valid.isValid, true);
});

test('createValidator enforces patterns', () => {
  const rules: ValidationRules = {
    email: { pattern: /^[^@]+@[^@]+\.[^@]+$/ },
  };
  const validate = createValidator(rules);

  const invalid = validate({ email: 'invalid-email' });
  assert.equal(invalid.isValid, false);
  assert.equal(invalid.errors.email, 'email format is invalid');

  const valid = validate({ email: 'test@example.com' });
  assert.equal(valid.isValid, true);
});

test('createValidator applies custom validation', () => {
  const rules: ValidationRules = {
    age: { custom: (value) => (parseInt(value, 10) < 18 ? 'Must be 18 or older' : null) },
  };
  const validate = createValidator(rules);

  const underage = validate({ age: '17' });
  assert.equal(underage.isValid, false);
  assert.equal(underage.errors.age, 'Must be 18 or older');

  const adult = validate({ age: '18' });
  assert.equal(adult.isValid, true);
});

test('validateAndThrow throws the first validation error', () => {
  const rules: ValidationRules = {
    name: { required: true },
  };
  const validate = createValidator(rules);

  assert.throws(
    () => validateAndThrow(validate, { name: '' }),
    (error: Error) => error.message === 'name is required'
  );
});

test('validateAndThrow returns successful results unchanged', () => {
  const rules: ValidationRules = {
    name: { required: true },
  };
  const validate = createValidator(rules);

  const result = validateAndThrow(validate, { name: 'Alice' });
  assert.equal(result.isValid, true);
  assert.deepEqual(result.errors, {});
});
