import assert from 'node:assert/strict';
import test from 'node:test';
import { getUserColor } from './useUserColors.ts';
import { colors } from '@/design-system/tokens.ts';

test('getUserColor returns correct style for Aaron', () => {
  const style = getUserColor('Aaron');
  assert.ok(style);
  assert.equal(style.primary, colors.secondary);
  assert.equal(style.light, colors.secondaryHover);
  assert.equal(style.gradient, colors.gradientBlue);
});

test('getUserColor returns correct style for Electra', () => {
  const style = getUserColor('Electra');
  assert.ok(style);
  assert.equal(style.primary, colors.accent);
  assert.equal(style.light, colors.accentHover);
  assert.equal(style.gradient, colors.gradientPink);
});

test('getUserColor returns null for null user', () => {
  const style = getUserColor(null);
  assert.equal(style, null);
});

test('getUserColor returns null for undefined user', () => {
  const style = getUserColor(undefined);
  assert.equal(style, null);
});

test('getUserColor returns null for invalid user', () => {
  // @ts-expect-error Testing invalid user
  const style = getUserColor('InvalidUser');
  assert.equal(style, null);
});
