import assert from 'node:assert/strict';
import test from 'node:test';

import { writeStoredJson } from './storageClient.ts';
import { getMetricCount, trackMetric } from './analyticsService.ts';

const originalConsoleWarn = console.warn;
const globalWithWindow = globalThis as typeof globalThis & { window?: unknown };
const originalWindow = globalWithWindow.window;

const resetWindow = () => {
  if (originalWindow === undefined) {
    Reflect.deleteProperty(globalWithWindow, 'window');
    return;
  }
  globalWithWindow.window = originalWindow;
};

test.afterEach(() => {
  console.warn = originalConsoleWarn;
  resetWindow();
});

test('writeStoredJson logs warning if localStorage.setItem throws', () => {
  const warnCalls: unknown[][] = [];
  console.warn = (...args: unknown[]) => {
    warnCalls.push(args);
  };

  const mockError = new Error('QuotaExceededError');
  globalWithWindow.window = {
    localStorage: {
      setItem: () => {
        throw mockError;
      },
    },
  } as unknown as Window & typeof globalThis;

  const cloneFn = <T,>(value: T) => value;
  const result = writeStoredJson({
    storageKey: 'test-key',
    value: { data: 123 },
    clone: cloneFn,
    label: 'test data',
  });

  assert.deepEqual(result, { data: 123 });
  assert.equal(warnCalls.length, 1);
  assert.equal(warnCalls[0]?.[0], 'Failed to persist test data.');
  assert.equal(warnCalls[0]?.[1], mockError);
});

test('writeStoredJson handles undefined window without throwing', () => {
  resetWindow();

  const warnCalls: unknown[][] = [];
  console.warn = (...args: unknown[]) => {
    warnCalls.push(args);
  };

  const cloneFn = <T,>(value: T) => value;
  const result = writeStoredJson({
    storageKey: 'test-key',
    value: { data: 456 },
    clone: cloneFn,
    label: 'test data',
  });

  assert.deepEqual(result, { data: 456 });
  assert.equal(warnCalls.length, 0);
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
