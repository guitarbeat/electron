import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { removeStoredJson, readStoredJson, writeStoredJson } from './storageClient.ts';
import { getMetricCount, trackMetric } from './analyticsService.ts';

test('removeStoredJson handles window.localStorage.removeItem throwing error', () => {
  const originalWindow = global.window;

  const mockWarn = mock.method(console, 'warn', () => {});

  global.window = {
    localStorage: {
      removeItem: () => {
        throw new Error('Storage error');
      }
    }
  } as unknown as Window & typeof globalThis;

  try {
    removeStoredJson('testKey', 'testLabel');
    assert.equal(mockWarn.mock.calls.length, 1);
    assert.equal(mockWarn.mock.calls[0].arguments[0], 'Failed to clear testLabel.');
    assert.equal(mockWarn.mock.calls[0].arguments[1].message, 'Storage error');
  } finally {
    global.window = originalWindow;
    mock.restoreAll();
  }
});

test('removeStoredJson calls window.localStorage.removeItem successfully', () => {
  const originalWindow = global.window;

  const mockWarn = mock.method(console, 'warn', () => {});
  let removedKey = '';

  global.window = {
    localStorage: {
      removeItem: (key: string) => {
        removedKey = key;
      }
    }
  } as unknown as Window & typeof globalThis;

  try {
    removeStoredJson('testKey', 'testLabel');
    assert.equal(removedKey, 'testKey');
    assert.equal(mockWarn.mock.calls.length, 0);
  } finally {
    global.window = originalWindow;
    mock.restoreAll();
  }
});

test('readStoredJson handles undefined window', () => {
  const originalWindow = global.window;
  global.window = undefined as unknown as Window & typeof globalThis;
  try {
    const result = readStoredJson({
      storageKey: 'testKey',
      validate: (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null,
      clone: (v) => v,
      label: 'testLabel'
    });
    assert.equal(result, null);
  } finally {
    global.window = originalWindow;
  }
});

test('writeStoredJson handles undefined window', () => {
  const originalWindow = global.window;
  global.window = undefined as unknown as Window & typeof globalThis;
  try {
    const result = writeStoredJson({
      storageKey: 'testKey',
      value: 'testValue',
      clone: (v) => v,
      label: 'testLabel'
    });
    assert.equal(result, 'testValue');
  } finally {
    global.window = originalWindow;
  }
});

test('readStoredJson handles window.localStorage.getItem throwing error', () => {
  const originalWindow = global.window;

  const mockWarn = mock.method(console, 'warn', () => {});

  global.window = {
    localStorage: {
      getItem: () => {
        throw new Error('Storage error');
      }
    }
  } as unknown as Window & typeof globalThis;

  try {
    const result = readStoredJson({
      storageKey: 'testKey',
      validate: (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null,
      clone: (v) => v,
      label: 'testLabel'
    });
    assert.equal(result, null);
    assert.equal(mockWarn.mock.calls.length, 1);
    assert.equal(mockWarn.mock.calls[0].arguments[0], 'Failed to read testLabel.');
    assert.equal(mockWarn.mock.calls[0].arguments[1].message, 'Storage error');
  } finally {
    global.window = originalWindow;
    mock.restoreAll();
  }
});

test('writeStoredJson handles window.localStorage.setItem throwing error', () => {
  const originalWindow = global.window;

  const mockWarn = mock.method(console, 'warn', () => {});

  global.window = {
    localStorage: {
      setItem: () => {
        throw new Error('Storage error');
      }
    }
  } as unknown as Window & typeof globalThis;

  try {
    const result = writeStoredJson({
      storageKey: 'testKey',
      value: 'testValue',
      clone: (v) => v,
      label: 'testLabel'
    });
    assert.equal(result, 'testValue');
    assert.equal(mockWarn.mock.calls.length, 1);
    assert.equal(mockWarn.mock.calls[0].arguments[0], 'Failed to persist testLabel.');
    assert.equal(mockWarn.mock.calls[0].arguments[1].message, 'Storage error');
  } finally {
    global.window = originalWindow;
    mock.restoreAll();
  }
});

test('readStoredJson calls window.localStorage.getItem successfully', () => {
  const originalWindow = global.window;

  const mockWarn = mock.method(console, 'warn', () => {});

  global.window = {
    localStorage: {
      getItem: () => {
        return JSON.stringify({ ok: true });
      }
    }
  } as unknown as Window & typeof globalThis;

  try {
    const result = readStoredJson({
      storageKey: 'testKey',
      validate: (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null,
      clone: (v) => ({...v}),
      label: 'testLabel'
    });
    assert.deepEqual(result, { ok: true });
    assert.equal(mockWarn.mock.calls.length, 0);
  } finally {
    global.window = originalWindow;
    mock.restoreAll();
  }
});

test('writeStoredJson calls window.localStorage.setItem successfully', () => {
  const originalWindow = global.window;

  const mockWarn = mock.method(console, 'warn', () => {});
  let storedKey = '';
  let storedValue = '';

  global.window = {
    localStorage: {
      setItem: (key: string, value: string) => {
        storedKey = key;
        storedValue = value;
      }
    }
  } as unknown as Window & typeof globalThis;

  try {
    const result = writeStoredJson({
      storageKey: 'testKey',
      value: { ok: true },
      clone: (v) => ({...v}),
      label: 'testLabel'
    });
    assert.deepEqual(result, { ok: true });
    assert.equal(storedKey, 'testKey');
    assert.equal(storedValue, 'v1:eyJvayI6dHJ1ZX0=');
    assert.equal(mockWarn.mock.calls.length, 0);
  } finally {
    global.window = originalWindow;
    mock.restoreAll();
  }
});

test('trackMetric increments metric successfully', () => {
  const originalWindow = global.window;

  const storage: Record<string, string> = {
    'movieList.analyticsMetrics': 'v1:eyJzdWdnZXN0aW9uX3N1Ym1pdHRlZCI6MX0='
  };

  global.window = {
    localStorage: {
      getItem: (key: string) => storage[key] || null,
      setItem: (key: string, value: string) => {
        storage[key] = value;
      }
    }
  } as unknown as Window & typeof globalThis;

  try {
    const result = trackMetric('suggestion_submitted');
    assert.deepEqual(result, { suggestion_submitted: 2 });
    assert.equal(storage['movieList.analyticsMetrics'], 'v1:eyJzdWdnZXN0aW9uX3N1Ym1pdHRlZCI6Mn0=');

    const result2 = trackMetric('suggestion_accepted');
    assert.deepEqual(result2, { suggestion_submitted: 2, suggestion_accepted: 1 });
    assert.equal(storage['movieList.analyticsMetrics'], 'v1:eyJzdWdnZXN0aW9uX3N1Ym1pdHRlZCI6Miwic3VnZ2VzdGlvbl9hY2NlcHRlZCI6MX0=');
  } finally {
    global.window = originalWindow;
  }
});

test('getMetricCount retrieves metric successfully', () => {
  const originalWindow = global.window;

  const storage: Record<string, string> = {
    'movieList.analyticsMetrics': 'v1:eyJzdWdnZXN0aW9uX3N1Ym1pdHRlZCI6NX0='
  };

  global.window = {
    localStorage: {
      getItem: (key: string) => storage[key] || null
    }
  } as unknown as Window & typeof globalThis;

  try {
    const count1 = getMetricCount('suggestion_submitted');
    assert.equal(count1, 5);

    const count2 = getMetricCount('suggestion_accepted');
    assert.equal(count2, 0);
  } finally {
    global.window = originalWindow;
  }
});

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

test('analyticsService operations', async (t) => {
  const originalWindow = (global as typeof globalThis & { window?: unknown }).window;
  const originalGlobalThisWindow = (globalThis as typeof globalThis & { window?: unknown }).window;
  const storage = new MemoryStorage();

  const mockWindow = { localStorage: storage } as unknown as Window & typeof globalThis;

  await t.test('getMetricCount returns 0 for non-existent metric', () => {
    (global as typeof globalThis & { window?: unknown }).window = mockWindow;
    (globalThis as typeof globalThis & { window?: unknown }).window = mockWindow;
    storage.removeItem('movieList.analyticsMetrics');
    const count = getMetricCount('suggestion_submitted');
    assert.equal(count, 0);
  });

  await t.test('trackMetric initializes a new metric to 1', () => {
    (global as typeof globalThis & { window?: unknown }).window = mockWindow;
    (globalThis as typeof globalThis & { window?: unknown }).window = mockWindow;
    storage.removeItem('movieList.analyticsMetrics');
    trackMetric('suggestion_accepted');
    const count = getMetricCount('suggestion_accepted');
    assert.equal(count, 1);
  });

  await t.test('trackMetric increments an existing metric', () => {
    (global as typeof globalThis & { window?: unknown }).window = mockWindow;
    (globalThis as typeof globalThis & { window?: unknown }).window = mockWindow;
    storage.removeItem('movieList.analyticsMetrics');
    trackMetric('suggestion_submitted');
    trackMetric('suggestion_submitted');
    const count = getMetricCount('suggestion_submitted');
    assert.equal(count, 2);
  });

  (global as typeof globalThis & { window?: unknown }).window = originalWindow;
  (globalThis as typeof globalThis & { window?: unknown }).window = originalGlobalThisWindow;
});
