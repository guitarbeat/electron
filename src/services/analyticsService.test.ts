import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import {
  removeStoredJson,
  readStoredJson,
  writeStoredJson,
  trackMetric,
  getMetricCount
} from './analyticsService.ts';

test('removeStoredJson handles undefined window', () => {
  const originalWindow = global.window;
  global.window = undefined as any;
  try {
    assert.doesNotThrow(() => removeStoredJson('key', 'label'));
  } finally {
    global.window = originalWindow;
  }
});

test('removeStoredJson handles window.localStorage.removeItem throwing error', (t) => {
  const originalWindow = global.window;

  const mockWarn = mock.method(console, 'warn', () => {});

  global.window = {
    localStorage: {
      removeItem: () => {
        throw new Error('Storage error');
      }
    }
  } as any;

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

test('removeStoredJson calls window.localStorage.removeItem successfully', (t) => {
  const originalWindow = global.window;

  const mockWarn = mock.method(console, 'warn', () => {});
  let removedKey = '';

  global.window = {
    localStorage: {
      removeItem: (key: string) => {
        removedKey = key;
      }
    }
  } as any;

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
  global.window = undefined as any;
  try {
    const result = readStoredJson({
      storageKey: 'testKey',
      validate: (v): v is any => true,
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
  global.window = undefined as any;
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

test('readStoredJson handles window.localStorage.getItem throwing error', (t) => {
  const originalWindow = global.window;

  const mockWarn = mock.method(console, 'warn', () => {});

  global.window = {
    localStorage: {
      getItem: () => {
        throw new Error('Storage error');
      }
    }
  } as any;

  try {
    const result = readStoredJson({
      storageKey: 'testKey',
      validate: (v): v is any => true,
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

test('writeStoredJson handles window.localStorage.setItem throwing error', (t) => {
  const originalWindow = global.window;

  const mockWarn = mock.method(console, 'warn', () => {});

  global.window = {
    localStorage: {
      setItem: () => {
        throw new Error('Storage error');
      }
    }
  } as any;

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

test('readStoredJson calls window.localStorage.getItem successfully', (t) => {
  const originalWindow = global.window;

  const mockWarn = mock.method(console, 'warn', () => {});

  global.window = {
    localStorage: {
      getItem: (key: string) => {
        return JSON.stringify({ ok: true });
      }
    }
  } as any;

  try {
    const result = readStoredJson({
      storageKey: 'testKey',
      validate: (v): v is any => true,
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

test('writeStoredJson calls window.localStorage.setItem successfully', (t) => {
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
  } as any;

  try {
    const result = writeStoredJson({
      storageKey: 'testKey',
      value: { ok: true },
      clone: (v) => ({...v}),
      label: 'testLabel'
    });
    assert.deepEqual(result, { ok: true });
    assert.equal(storedKey, 'testKey');
    assert.equal(storedValue, '{"ok":true}');
    assert.equal(mockWarn.mock.calls.length, 0);
  } finally {
    global.window = originalWindow;
    mock.restoreAll();
  }
});

test('trackMetric increments metric successfully', () => {
  const originalWindow = global.window;

  let storage: Record<string, string> = {
    'movieList.analyticsMetrics': JSON.stringify({ suggestion_submitted: 1 })
  };

  global.window = {
    localStorage: {
      getItem: (key: string) => storage[key] || null,
      setItem: (key: string, value: string) => {
        storage[key] = value;
      }
    }
  } as any;

  try {
    const result = trackMetric('suggestion_submitted');
    assert.deepEqual(result, { suggestion_submitted: 2 });
    assert.equal(storage['movieList.analyticsMetrics'], '{"suggestion_submitted":2}');

    const result2 = trackMetric('suggestion_accepted');
    assert.deepEqual(result2, { suggestion_submitted: 2, suggestion_accepted: 1 });
    assert.equal(storage['movieList.analyticsMetrics'], '{"suggestion_submitted":2,"suggestion_accepted":1}');
  } finally {
    global.window = originalWindow;
  }
});

test('getMetricCount retrieves metric successfully', () => {
  const originalWindow = global.window;

  let storage: Record<string, string> = {
    'movieList.analyticsMetrics': JSON.stringify({ suggestion_submitted: 5 })
  };

  global.window = {
    localStorage: {
      getItem: (key: string) => storage[key] || null
    }
  } as any;

  try {
    const count1 = getMetricCount('suggestion_submitted');
    assert.equal(count1, 5);

    const count2 = getMetricCount('suggestion_accepted');
    assert.equal(count2, 0);
  } finally {
    global.window = originalWindow;
  }
});
