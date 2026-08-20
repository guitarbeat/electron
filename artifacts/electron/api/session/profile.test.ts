import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isMissingSessionSecretError } from './profile.ts';

describe('profile session error handling', () => {
  it('identifies missing session secret errors correctly', () => {
    const strictError = new Error('SESSION_SIGNING_SECRET is not configured.');
    const verboseError = new Error(
      'SESSION_SIGNING_SECRET is not configured. ' +
      'Set SESSION_SIGNING_SECRET to a stable secret value in your environment.'
    );
    const unrelatedError = new Error('Some other error occurred.');

    assert.equal(isMissingSessionSecretError(strictError), true);
    assert.equal(isMissingSessionSecretError(verboseError), true);
    assert.equal(isMissingSessionSecretError(unrelatedError), false);
    assert.equal(isMissingSessionSecretError(null), false);
    assert.equal(isMissingSessionSecretError('string error'), false);
  });
});
