import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isGistReadConfigured,
  isGistWriteConfigured,
  readLocalOverride,
  readStoredJson,
  setLocalOverride,
  writeStoredJson,
} from '../src/services/gistClient.ts';

const installMockWindow = () => {
  const storage = new Map<string, string>();
  const originalWindowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');

  const localStorage = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
    removeItem: (key: string) => {
      storage.delete(key);
    },
  };

  Object.defineProperty(globalThis, 'window', {
    value: { localStorage },
    configurable: true,
    writable: true,
  });

  return {
    storage,
    restore: () => {
      if (originalWindowDescriptor) {
        Object.defineProperty(globalThis, 'window', originalWindowDescriptor);
      } else {
        Reflect.deleteProperty(globalThis, 'window');
      }
    },
  };
};

test('isGistReadConfigured requires a non-empty gist id', () => {
  assert.equal(isGistReadConfigured(''), false);
  assert.equal(isGistReadConfigured('   '), false);
  assert.equal(isGistReadConfigured('"abc123"'), true);
});

test('isGistWriteConfigured relies on gist id when using the proxy', () => {
  assert.equal(isGistWriteConfigured(''), false);
  assert.equal(isGistWriteConfigured('   '), false);
  assert.equal(isGistWriteConfigured('abc123'), true);
});

test('writeStoredJson persists a cloned value that readStoredJson can load back', () => {
  const { storage, restore } = installMockWindow();

  try {
    const source = { items: ['one'] };
    const stored = writeStoredJson({
      storageKey: 'test.items',
      value: source,
      clone: (value) => ({ items: [...value.items] }),
      label: 'test items',
    });

    source.items.push('two');

    const readBack = readStoredJson({
      storageKey: 'test.items',
      validate: (
        value
      ): value is {
        items: string[];
      } =>
        Boolean(
          value &&
            typeof value === 'object' &&
            'items' in value &&
            Array.isArray((value as { items?: unknown }).items)
        ),
      clone: (value) => ({ items: [...value.items] }),
      label: 'test items',
    });

    assert.deepEqual(stored, { items: ['one'] });
    assert.equal(storage.get('test.items'), JSON.stringify({ items: ['one'] }));
    assert.deepEqual(readBack, { items: ['one'] });
  } finally {
    restore();
  }
});

test('readLocalOverride preserves explicit null local state when override is enabled', () => {
  const { restore } = installMockWindow();

  try {
    let reads = 0;
    const readStored = () => {
      reads += 1;
      return null as null | { id: string };
    };

    assert.deepEqual(readLocalOverride('matchmaker', readStored), { enabled: false, value: null });
    assert.equal(reads, 0);

    setLocalOverride('matchmaker', true);

    assert.deepEqual(readLocalOverride('matchmaker', readStored), {
      enabled: true,
      value: null,
    });
    assert.equal(reads, 1);
  } finally {
    restore();
  }
});
