import assert from 'node:assert/strict';
import test from 'node:test';

import { pollingManager } from './index.ts';

test('pollingManager notifies listeners when polling fails', async () => {
  const originalConsoleError = console.error;
  console.error = () => {};

  const error = new Error('Fetch failed');
  const key = `polling-error-${Date.now()}`;
  let receivedData: unknown;
  let receivedError: unknown;

  const unsubscribe = pollingManager.subscribe(
    key,
    async () => {
      throw error;
    },
    1_000,
    (data, subscribeError) => {
      receivedData = data;
      receivedError = subscribeError;
    }
  );

  try {
    await pollingManager.refresh(key);

    assert.equal(receivedData, undefined);
    assert.equal(receivedError, error);
    assert.equal(pollingManager.getError(key), error);
  } finally {
    unsubscribe();
    console.error = originalConsoleError;
  }
});
