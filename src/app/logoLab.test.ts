import assert from 'node:assert/strict';
import test from 'node:test';
import { getRequestedLogoVariant, isLogoLabEnabled } from './logoLab.ts';

test('logo lab query flag is enabled for present and truthy values', () => {
  assert.equal(isLogoLabEnabled('?logo-lab=1'), true);
  assert.equal(isLogoLabEnabled('?logo-lab=true'), true);
  assert.equal(isLogoLabEnabled('?logo-lab='), true);
});

test('logo lab query flag is disabled for missing or explicit falsey values', () => {
  assert.equal(isLogoLabEnabled(''), false);
  assert.equal(isLogoLabEnabled('?logo-lab=0'), false);
  assert.equal(isLogoLabEnabled('?logo-lab=off'), false);
});

test('logo lab variant query falls back to the default mark when missing or invalid', () => {
  assert.equal(getRequestedLogoVariant(''), 'pulse-ae');
  assert.equal(getRequestedLogoVariant('?logo-variant=unknown'), 'pulse-ae');
  assert.equal(getRequestedLogoVariant('?logo-variant=static-gem'), 'static-gem');
});
