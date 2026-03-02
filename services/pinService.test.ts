import assert from 'node:assert/strict';
import { mock, test, after, beforeEach } from 'node:test';
import {
  secureHashPin,
  getPins,
  savePins,
  setPin,
  removePin,
  verifyPin,
  hasPin,
} from './pinService.ts';

const MOCK_DATE = new Date('2024-03-20T12:00:00Z');
const CACHE_TTL = 5 * 60 * 1000;

test('pinService', async (t) => {
  // Mock Date using mock.timers to freeze time
  t.mock.timers.enable({ apis: ['Date'], now: MOCK_DATE });

  // Mock global.fetch
  const fetchMock = mock.method(global, 'fetch');

  // Restore fetch after all tests in this suite
  after(() => {
    fetchMock.mock.restore();
  });

  // Clear mock history and implementations before each test
  beforeEach(() => {
    fetchMock.mock.resetCalls();
    // Reset to a default mock that returns an empty successful response
    fetchMock.mock.mockImplementation(async () => {
      return new Response(JSON.stringify({ files: {} }), { status: 200 });
    });
  });

  await t.test('secureHashPin returns valid PBKDF2 hash', async () => {
    const pin = '1234';
    const hash = await secureHashPin(pin);
    assert.ok(hash.startsWith('pbkdf2:100000:'));
    const parts = hash.split(':');
    assert.equal(parts.length, 4);
  });

  await t.test('getPins fetches pins from Gist and caches the result', async () => {
    const mockPins = { Aaron: await secureHashPin('1111') };
    fetchMock.mock.mockImplementation(async () => {
      return new Response(
        JSON.stringify({
          files: {
            'pins.json': {
              content: JSON.stringify(mockPins),
            },
          },
        }),
        { status: 200 }
      );
    });

    // Advance time to ensure re-fetch
    t.mock.timers.tick(CACHE_TTL + 1000);

    // First call - should fetch
    const pins1 = await getPins();
    assert.deepEqual(pins1, mockPins);
    assert.equal(fetchMock.mock.callCount(), 1);

    // Second call - should use cache
    const pins2 = await getPins();
    assert.deepEqual(pins2, mockPins);
    assert.equal(fetchMock.mock.callCount(), 1);

    // Advance time beyond TTL
    t.mock.timers.tick(CACHE_TTL + 1000);

    // Third call - should fetch again
    const pins3 = await getPins();
    assert.deepEqual(pins3, mockPins);
    assert.equal(fetchMock.mock.callCount(), 2);
  });

  await t.test('getPins returns empty object if file is missing', async () => {
    t.mock.timers.tick(CACHE_TTL + 1000);

    fetchMock.mock.mockImplementation(async () => {
      return new Response(
        JSON.stringify({
          files: {},
        }),
        { status: 200 }
      );
    });

    const pins = await getPins();
    assert.deepEqual(pins, {});
  });

  await t.test('getPins returns empty object on fetch error', async () => {
    t.mock.timers.tick(CACHE_TTL + 1000);

    fetchMock.mock.mockImplementation(async () => {
      return new Response(null, { status: 500 });
    });

    const pins = await getPins();
    assert.deepEqual(pins, {});
  });

  await t.test('savePins patches Gist and updates cache', async () => {
    const newPins = { Aaron: await secureHashPin('2222'), Electra: await secureHashPin('3333') };

    fetchMock.mock.mockImplementation(async (url, options) => {
      if (options?.method === 'PATCH') {
        const body = JSON.parse(options.body as string);
        assert.deepEqual(JSON.parse(body.files['pins.json'].content), newPins);
        return new Response(JSON.stringify({}), { status: 200 });
      }
      return new Response(null, { status: 400 });
    });

    const success = await savePins(newPins);
    assert.strictEqual(success, true);

    // Verify cache was updated (advance time slightly but stay within TTL)
    t.mock.timers.tick(1000);
    const cachedPins = await getPins();
    assert.deepEqual(cachedPins, newPins);
    // Should NOT have called fetch for getPins because of cache
    assert.equal(fetchMock.mock.callCount(), 1);
  });

  await t.test('savePins returns false on error', async () => {
    fetchMock.mock.mockImplementation(async () => {
      return new Response(null, { status: 403 });
    });

    const success = await savePins({});
    assert.strictEqual(success, false);
  });

  await t.test('setPin updates user pin with secure hash', async () => {
    const targetPin = '1234';
    t.mock.timers.tick(CACHE_TTL + 1000);

    fetchMock.mock.mockImplementation(async (url, options) => {
      if (options?.method === 'PATCH') {
        const body = JSON.parse(options.body as string);
        const pins = JSON.parse(body.files['pins.json'].content);
        assert.ok(pins.Aaron.startsWith('pbkdf2:'));
        return new Response(JSON.stringify({}), { status: 200 });
      }
      // Default GET response for getPins()
      return new Response(
        JSON.stringify({
          files: { 'pins.json': { content: JSON.stringify({}) } },
        }),
        { status: 200 }
      );
    });

    const success = await setPin('Aaron', targetPin);
    assert.strictEqual(success, true);
    // One GET for getPins, one PATCH for savePins
    assert.equal(fetchMock.mock.callCount(), 2);
  });

  await t.test('removePin deletes user pin', async () => {
    t.mock.timers.tick(CACHE_TTL + 1000);

    fetchMock.mock.mockImplementation(async (url, options) => {
      if (options?.method === 'PATCH') {
        const body = JSON.parse(options.body as string);
        const pins = JSON.parse(body.files['pins.json'].content);
        assert.strictEqual(pins.Aaron, undefined);
        assert.strictEqual(pins.Electra, 'hash2');
        return new Response(JSON.stringify({}), { status: 200 });
      }
      return new Response(
        JSON.stringify({
          files: { 'pins.json': { content: JSON.stringify({ Aaron: 'hash', Electra: 'hash2' }) } },
        }),
        { status: 200 }
      );
    });

    const success = await removePin('Aaron');
    assert.strictEqual(success, true);
  });

  await t.test('verifyPin returns true if no pin is set', async () => {
    t.mock.timers.tick(CACHE_TTL + 1000);
    fetchMock.mock.mockImplementation(async () => {
      return new Response(
        JSON.stringify({
          files: { 'pins.json': { content: JSON.stringify({}) } },
        }),
        { status: 200 }
      );
    });

    const verified = await verifyPin('Aaron', 'any');
    assert.strictEqual(verified, true);
  });

  await t.test('verifyPin returns true for correct secure pin', async () => {
    const pin = '5555';
    const secureHash = await secureHashPin(pin);

    t.mock.timers.tick(CACHE_TTL + 1000);
    fetchMock.mock.mockImplementation(async () => {
      return new Response(
        JSON.stringify({
          files: { 'pins.json': { content: JSON.stringify({ Aaron: secureHash }) } },
        }),
        { status: 200 }
      );
    });

    const verified = await verifyPin('Aaron', pin);
    assert.strictEqual(verified, true);
  });

  await t.test('verifyPin returns false for incorrect pin (secure)', async () => {
    const secureHash = await secureHashPin('1234');
    t.mock.timers.tick(CACHE_TTL + 1000);
    fetchMock.mock.mockImplementation(async () => {
      return new Response(
        JSON.stringify({
          files: { 'pins.json': { content: JSON.stringify({ Aaron: secureHash }) } },
        }),
        { status: 200 }
      );
    });

    const verified = await verifyPin('Aaron', 'wrong');
    assert.strictEqual(verified, false);
  });

  await t.test('hasPin correctly reports pin existence', async () => {
    t.mock.timers.tick(CACHE_TTL + 1000);
    fetchMock.mock.mockImplementation(async () => {
      return new Response(
        JSON.stringify({
          files: { 'pins.json': { content: JSON.stringify({ Aaron: 'hash' }) } },
        }),
        { status: 200 }
      );
    });

    assert.strictEqual(await hasPin('Aaron'), true);
    assert.strictEqual(await hasPin('Electra'), false);
  });
});
