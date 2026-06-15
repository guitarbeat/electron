import assert from 'node:assert/strict';
import test from 'node:test';

import { isMockMode } from './mockData.ts';

class MemoryStorage {
  #store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.#store.has(key) ? this.#store.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.#store.set(key, value);
  }

  removeItem(key: string): void {
    this.#store.delete(key);
  }
}

const originalWindow = globalThis.window;

test('isMockMode defaults to false when no override is present', () => {
  const windowStub = {
    localStorage: new MemoryStorage(),
  } as unknown as Window & typeof globalThis;

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: windowStub,
  });

  try {
    assert.equal(isMockMode(), false);
  } finally {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: originalWindow,
    });
  }
});

test('isMockMode returns true when explicitly enabled in localStorage', () => {
  const localStorage = new MemoryStorage();
  localStorage.setItem('useMockData', 'true');

  const windowStub = {
    localStorage,
  } as unknown as Window & typeof globalThis;

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: windowStub,
  });

  try {
    assert.equal(isMockMode(), true);
  } finally {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: originalWindow,
    });
  }
});
