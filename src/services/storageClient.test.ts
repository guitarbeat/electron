import test from 'node:test';
import assert from 'node:assert/strict';
import { readStoredJson, writeStoredJson, removeStoredJson } from './storageClient.ts';

// Mock localStorage
class MemoryStorage {
  private store: Map<string, string>;
  constructor() {
    this.store = new Map();
  }
  getItem(key: string): string | null {
    return this.store.get(key) || null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
}

test('storageClient read and write operations', async (t) => {
  const originalWindow = global.window;
  const storage = new MemoryStorage();

  // @ts-expect-error - overriding global for tests
  global.window = { localStorage: storage };

  await t.test('writes encoded data', () => {
    const data = { test: 'value' };
    writeStoredJson({
      storageKey: 'testKey',
      value: data,
      clone: (val) => ({ ...val }),
      label: 'test data'
    });

    const rawStored = storage.getItem('testKey');
    assert.ok(rawStored?.startsWith('v1:'), 'Stored data should be prefixed with version marker');
    assert.notEqual(rawStored, JSON.stringify(data), 'Stored data should not be plaintext JSON');
  });

  await t.test('reads encoded data correctly', () => {
    const read = readStoredJson({
      storageKey: 'testKey',
      validate: (v: unknown): v is { test: string } => typeof v === 'object' && v !== null && 'test' in v,
      clone: (val) => ({ ...val }),
      label: 'test data'
    });

    assert.deepEqual(read, { test: 'value' }, 'Should decode and return original data');
  });

  await t.test('reads legacy plaintext gracefully', () => {
    const legacyData = { legacy: 'data' };
    storage.setItem('legacyKey', JSON.stringify(legacyData));

    const read = readStoredJson({
      storageKey: 'legacyKey',
      validate: (v: unknown): v is { legacy: string } => typeof v === 'object' && v !== null && 'legacy' in v,
      clone: (val) => ({ ...val }),
      label: 'legacy test data'
    });

    assert.deepEqual(read, legacyData, 'Should fallback and parse legacy plaintext data properly');
  });


  await t.test('handles invalid JSON gracefully', (t) => {
    const warnMock = t.mock.method(console, 'warn', () => {});

    storage.setItem('invalidKey', 'not-valid-json');

    const read = readStoredJson({
      storageKey: 'invalidKey',
      validate: (v: unknown): v is { test: string } => !!v,
      clone: (v) => ({ ...v }),
      label: 'invalid data'
    });

    assert.equal(read, null, 'Should return null on parse error');
    assert.equal(warnMock.mock.calls.length, 1, 'Should log a warning');
    assert.ok(warnMock.mock.calls[0].arguments[0].includes('Failed to read invalid data.'), 'Warning should contain label');

    warnMock.mock.restore();
  });

  await t.test('removes data', () => {
    removeStoredJson('testKey', 'test data');
    const read = storage.getItem('testKey');
    assert.equal(read, null, 'Should remove the item from local storage');
  });


  await t.test('handles localStorage errors gracefully', async (t) => {
    const errorStorage = new MemoryStorage();
    errorStorage.getItem = () => { throw new Error('getItem error'); };
    errorStorage.setItem = () => { throw new Error('setItem error'); };
    errorStorage.removeItem = () => { throw new Error('removeItem error'); };

    // @ts-expect-error - overriding global for tests
    global.window = { localStorage: errorStorage };

    await t.test('readStoredJson catches errors', () => {
      const consoleWarnMock = t.mock.method(console, 'warn', () => {});
      const read = readStoredJson({
        storageKey: 'errorKey',
        validate: ((v: unknown): v is unknown => { const isObj = typeof v === 'object'; return isObj || true; }) as (value: unknown) => value is unknown,
        clone: (v) => v,
        label: 'error test data'
      });
      assert.equal(read, null, 'Should return null on read error');
      assert.equal(consoleWarnMock.mock.callCount(), 1, 'Should log a warning');
      consoleWarnMock.mock.restore();
    });

    await t.test('writeStoredJson catches errors', () => {
      const consoleWarnMock = t.mock.method(console, 'warn', () => {});
      const data = { test: 'value' };
      const written = writeStoredJson({
        storageKey: 'errorKey',
        value: data,
        clone: (v) => ({ ...v }),
        label: 'error test data'
      });
      assert.deepEqual(written, data, 'Should return the value even if persist fails');
      assert.equal(consoleWarnMock.mock.callCount(), 1, 'Should log a warning');
      consoleWarnMock.mock.restore();
    });

    await t.test('removeStoredJson catches errors', () => {
      const consoleWarnMock = t.mock.method(console, 'warn', () => {});
      removeStoredJson('errorKey', 'error test data');
      assert.equal(consoleWarnMock.mock.callCount(), 1, 'Should log a warning');
      consoleWarnMock.mock.restore();
    });
  });

  global.window = originalWindow;
});
