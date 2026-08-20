import { describe, it } from 'node:test';
import assert from 'node:assert';
import { cleanEnvValue } from './dbCommon.js';

describe('cleanEnvValue', () => {
  it('should handle undefined', () => {
    assert.strictEqual(cleanEnvValue(undefined), '');
  });

  it('should handle empty string', () => {
    assert.strictEqual(cleanEnvValue(''), '');
  });

  it('should handle string with spaces', () => {
    assert.strictEqual(cleanEnvValue('  hello  '), 'hello');
  });

  it('should handle single quotes', () => {
    assert.strictEqual(cleanEnvValue("'hello'"), 'hello');
  });

  it('should handle double quotes', () => {
    assert.strictEqual(cleanEnvValue('"hello"'), 'hello');
  });

  it('should handle nested quotes', () => {
    assert.strictEqual(cleanEnvValue('\'"hello"\''), 'hello');
  });

  it('should handle unmatched quotes', () => {
    assert.strictEqual(cleanEnvValue('"hello\''), '"hello\'');
    assert.strictEqual(cleanEnvValue('\'hello"'), '\'hello"');
  });

  it('should handle whitespace inside quotes', () => {
    assert.strictEqual(cleanEnvValue('"  hello  "'), 'hello');
  });

  it('should handle empty quotes', () => {
    assert.strictEqual(cleanEnvValue('""'), '');
    assert.strictEqual(cleanEnvValue("''"), '');
  });
});
