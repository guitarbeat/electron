import assert from 'node:assert/strict';
import test from 'node:test';
import { readStoredJson, writeStoredJson, removeStoredJson, trackMetric, getMetricCount } from './analyticsService.ts';

// Mock window for testing
const setupMockWindow = () => {
  const store: Record<string, string> = {};
  const mockWindow = {
    localStorage: {
      getItem(key: string) {
        return store[key] || null;
      },
      setItem(key: string, value: string) {
        if (key === 'throw_write') {
           throw new Error('Storage Full');
        }
        store[key] = value.toString();
      },
      removeItem(key: string) {
        if (key === 'throw_remove') {
           throw new Error('Remove failed');
        }
        delete store[key];
      },
      clear() {
        for (const key in store) {
          delete store[key];
        }
      }
    }
  };

  const originalWindow = global.window;

  // @ts-expect-error Mocking global window
  global.window = mockWindow;

  return {
    restore: () => {
      global.window = originalWindow;
    },
    store
  };
};

test('analyticsService', async (t) => {
  let mockContext: { restore: () => void, store: Record<string, string> };

  t.beforeEach(() => {
    mockContext = setupMockWindow();
  });

  t.afterEach(() => {
    mockContext.restore();
  });

  await t.test('readStoredJson error handling', async (st) => {
    await st.test('returns null and warns when JSON parsing fails', () => {
      mockContext.store['bad_json'] = '{invalid';

      const originalWarn = console.warn;
      let warned = false;
      console.warn = () => { warned = true; };

      const result = readStoredJson({
        storageKey: 'bad_json',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
        validate: (_v: any): _v is any => true,
        clone: (v: unknown) => v,
        label: 'bad data'
      });

      console.warn = originalWarn;

      assert.equal(result, null);
      assert.equal(warned, true);
    });

    await st.test('returns null when validate fails but does not warn (or handle it differently depending on design)', () => {
      mockContext.store['invalid_data'] = '{"foo": "bar"}';

      const originalWarn = console.warn;
      let warned = false;
      console.warn = () => { warned = true; };

      const result = readStoredJson({
        storageKey: 'invalid_data',
        validate: (v: unknown): v is string => typeof v === 'string', // fails
        clone: (v: unknown) => v,
        label: 'invalid data'
      });

      console.warn = originalWarn;

      assert.equal(result, null);
      // It doesn't warn on validation failure, it just returns null at the end of the try block
      assert.equal(warned, false);
    });

    await st.test('returns null without warning if window is undefined', () => {
       const originalWindow = global.window;
       // Simulating window undefined
       delete (global as Partial<typeof global>).window;

       const originalWarn = console.warn;
       let warned = false;
       console.warn = () => { warned = true; };

       const result = readStoredJson({
        storageKey: 'test',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
        validate: (_v: any): _v is any => true,
        clone: (v: unknown) => v,
        label: 'test'
      });

      console.warn = originalWarn;
      global.window = originalWindow;

      assert.equal(result, null);
      assert.equal(warned, false);
    });
  });

  await t.test('writeStoredJson error handling', async (st) => {
    await st.test('warns and proceeds when setItem throws', () => {
      const originalWarn = console.warn;
      let warned = false;
      console.warn = () => { warned = true; };

      const result = writeStoredJson({
        storageKey: 'throw_write',
        value: { id: 1 },
        clone: (v) => ({...v}),
        label: 'throw data'
      });

      console.warn = originalWarn;

      assert.deepEqual(result, { id: 1 });
      assert.equal(warned, true);
    });

    await st.test('skips write if window is undefined', () => {
       const originalWindow = global.window;
       // Simulating window undefined
       delete (global as Partial<typeof global>).window;

       const originalWarn = console.warn;
       let warned = false;
       console.warn = () => { warned = true; };

       const result = writeStoredJson({
        storageKey: 'test',
        value: { id: 1 },
        clone: (v: unknown) => v ? JSON.parse(JSON.stringify(v)) : v,
        label: 'test'
      });

      console.warn = originalWarn;
      global.window = originalWindow;

      assert.deepEqual(result, { id: 1 });
      assert.equal(warned, false);
    });
  });

  await t.test('removeStoredJson error handling', async (st) => {
    await st.test('warns when removeItem throws', () => {
      const originalWarn = console.warn;
      let warned = false;
      console.warn = () => { warned = true; };

      removeStoredJson('throw_remove', 'throw data');

      console.warn = originalWarn;

      assert.equal(warned, true);
    });

    await st.test('skips remove if window is undefined', () => {
       const originalWindow = global.window;
       // Simulating window undefined
       delete (global as Partial<typeof global>).window;

       const originalWarn = console.warn;
       let warned = false;
       console.warn = () => { warned = true; };

       removeStoredJson('test', 'test');

      console.warn = originalWarn;
      global.window = originalWindow;

      assert.equal(warned, false);
    });
  });

  await t.test('analytics functionality', async (st) => {
    await st.test('trackMetric increments correctly', () => {
      assert.equal(getMetricCount('suggestion_submitted'), 0);

      trackMetric('suggestion_submitted');
      assert.equal(getMetricCount('suggestion_submitted'), 1);

      trackMetric('suggestion_submitted');
      assert.equal(getMetricCount('suggestion_submitted'), 2);

      assert.equal(getMetricCount('suggestion_accepted'), 0);
    });

    await st.test('trackMetric ignores invalid metric types in storage', () => {
      // Put invalid data in storage
      mockContext.store['movieList.analyticsMetrics'] = JSON.stringify({
        invalid_metric: 5,
        suggestion_submitted: 'not a number'
      });

      // Should treat as empty/invalid and return 0
      assert.equal(getMetricCount('suggestion_submitted'), 0);

      // Should reset and track correctly
      trackMetric('suggestion_submitted');
      assert.equal(getMetricCount('suggestion_submitted'), 1);

      // The invalid data was overwritten
      assert.equal(
        mockContext.store['movieList.analyticsMetrics'],
        JSON.stringify({ suggestion_submitted: 1 })
      );
    });
  });
});
