import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clonePins,
  createSerialTaskRunner,
  isUserPinsRecord,
  normalizeUserPins,
  parsePinsContent,
} from '../src/services/pinHelpers.ts';

test('normalizeUserPins trims hashes and drops empty values', () => {
  const normalized = normalizeUserPins({
    Aaron: '  pbkdf2:100000:aa:bb  ',
    Electra: '   ',
  });

  assert.deepEqual(normalized, {
    Aaron: 'pbkdf2:100000:aa:bb',
    Electra: undefined,
  });
});

test('isUserPinsRecord rejects non-object values', () => {
  assert.equal(isUserPinsRecord(null), false);
  assert.equal(isUserPinsRecord('pins'), false);
  assert.equal(isUserPinsRecord({ Aaron: 'hash' }), true);
});

test('parsePinsContent normalizes valid JSON and falls back on invalid JSON', () => {
  assert.deepEqual(parsePinsContent('{"Aaron":"  hash  ","Electra":""}'), {
    Aaron: 'hash',
    Electra: undefined,
  });

  const originalConsoleError = console.error;
  console.error = () => {};

  try {
    assert.deepEqual(parsePinsContent('{not valid json'), {});
  } finally {
    console.error = originalConsoleError;
  }
});

test('clonePins returns a detached copy', () => {
  const source = { Aaron: 'hash-a' };
  const cloned = clonePins(source);
  cloned.Electra = 'hash-b';

  assert.deepEqual(source, { Aaron: 'hash-a' });
  assert.deepEqual(cloned, { Aaron: 'hash-a', Electra: 'hash-b' });
});

test('createSerialTaskRunner preserves task order across concurrent calls', async () => {
  const runSerialTask = createSerialTaskRunner();
  const executionOrder: string[] = [];

  const firstTask = runSerialTask(async () => {
    executionOrder.push('start:first');
    await new Promise((resolve) => {
      setTimeout(resolve, 10);
    });
    executionOrder.push('end:first');
    return 'first';
  });

  const secondTask = runSerialTask(async () => {
    executionOrder.push('start:second');
    executionOrder.push('end:second');
    return 'second';
  });

  assert.deepEqual(await Promise.all([firstTask, secondTask]), ['first', 'second']);
  assert.deepEqual(executionOrder, ['start:first', 'end:first', 'start:second', 'end:second']);
});
