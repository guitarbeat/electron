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
      clone: (v) => ({ ...v }),
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
      clone: (v) => ({ ...v }),
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
      clone: (v) => ({ ...v }),
      label: 'legacy test data'
    });

    assert.deepEqual(read, legacyData, 'Should fallback and parse legacy plaintext data properly');
  });

  await t.test('removes data', () => {
    removeStoredJson('testKey', 'test data');
    const read = storage.getItem('testKey');
    assert.equal(read, null, 'Should remove the item from local storage');
  });

  global.window = originalWindow;
});
