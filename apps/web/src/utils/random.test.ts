import assert from "node:assert/strict";
import test from "node:test";
import {
  getSecureRandom,
  clamp,
  shallowCloneArray,
  shuffleArray,
  randomUtils,
} from "./random.ts";

test("getSecureRandom", async (t) => {
  await t.test("uses crypto.getRandomValues when available", () => {
    const originalCrypto = globalThis.crypto;
    try {
      let called = false;
      // Mock crypto.getRandomValues
      Object.defineProperty(globalThis, "crypto", {
        value: {
          getRandomValues: (array: Uint32Array) => {
            called = true;
            array[0] = 0x80000000; // Halfway: 2147483648
            return array;
          },
        },
        configurable: true,
        writable: true,
      });

      const val = getSecureRandom();
      assert.strictEqual(called, true);
      assert.strictEqual(val, 0x80000000 / (0xffffffff + 1));
    } finally {
      Object.defineProperty(globalThis, "crypto", {
        value: originalCrypto,
        configurable: true,
        writable: true,
      });
    }
  });

  await t.test("falls back to Math.random when crypto is undefined or missing getRandomValues", () => {
    const originalCrypto = globalThis.crypto;
    const originalMathRandom = Math.random;
    try {
      Object.defineProperty(globalThis, "crypto", {
        value: undefined,
        configurable: true,
        writable: true,
      });

      let mathRandomCalled = false;
      Math.random = () => {
        mathRandomCalled = true;
        return 0.42;
      };

      const val = getSecureRandom();
      assert.strictEqual(mathRandomCalled, true);
      assert.strictEqual(val, 0.42);
    } finally {
      Object.defineProperty(globalThis, "crypto", {
        value: originalCrypto,
        configurable: true,
        writable: true,
      });
      Math.random = originalMathRandom;
    }
  });
});

test("clamp", async (t) => {
  await t.test("clamps value below minimum", () => {
    assert.strictEqual(clamp(-5, 0, 10), 0);
  });

  await t.test("clamps value above maximum", () => {
    assert.strictEqual(clamp(15, 0, 10), 10);
  });

  await t.test("returns value within range", () => {
    assert.strictEqual(clamp(5, 0, 10), 5);
  });

  await t.test("handles boundary values equal to min or max", () => {
    assert.strictEqual(clamp(0, 0, 10), 0);
    assert.strictEqual(clamp(10, 0, 10), 10);
  });
});

test("shallowCloneArray", async (t) => {
  await t.test("creates a new array copy without mutating original", () => {
    const original = [1, 2, 3];
    const cloned = shallowCloneArray(original);

    assert.notStrictEqual(cloned, original);
    assert.deepStrictEqual(cloned, [1, 2, 3]);

    cloned.push(4);
    assert.deepStrictEqual(original, [1, 2, 3]);
  });
});

test("shuffleArray", async (t) => {
  await t.test("shuffles elements and does not mutate input array", () => {
    const input = [1, 2, 3, 4, 5];
    const originalCopy = [...input];
    const shuffled = shuffleArray(input);

    assert.deepStrictEqual(input, originalCopy);
    assert.strictEqual(shuffled.length, input.length);
    assert.deepStrictEqual(new Set(shuffled), new Set(input));
  });

  await t.test("handles empty and single-element arrays", () => {
    assert.deepStrictEqual(shuffleArray([]), []);
    assert.deepStrictEqual(shuffleArray([42]), [42]);
  });
});

test("randomUtils", async (t) => {
  await t.test("randomItem selects an item from an array", () => {
    const items = ["a", "b", "c"];
    const item = randomUtils.randomItem(items);
    assert.strictEqual(items.includes(item), true);
  });

  await t.test("randomItem returns undefined for empty array", () => {
    assert.strictEqual(randomUtils.randomItem([]), undefined);
  });

  await t.test("randomRange produces a value within min and max", () => {
    for (let i = 0; i < 20; i++) {
      const val = randomUtils.randomRange(10, 20);
      assert.strictEqual(val >= 10 && val < 20, true);
    }
  });

  await t.test("randomInt produces an integer within range", () => {
    for (let i = 0; i < 20; i++) {
      const val = randomUtils.randomInt(5, 15);
      assert.strictEqual(Number.isInteger(val), true);
      assert.strictEqual(val >= 5 && val < 15, true);
    }
  });

  await t.test("randomBool returns a boolean", () => {
    const val = randomUtils.randomBool();
    assert.strictEqual(typeof val, "boolean");
  });

  await t.test("generateConfettiParticle creates valid particle object", () => {
    const colors = ["#ff0000", "#00ff00", "#0000ff"];
    const particle = randomUtils.generateConfettiParticle(1, colors);

    assert.strictEqual(particle.id, 1);
    assert.strictEqual(typeof particle.x, "number");
    assert.strictEqual(particle.x >= 0 && particle.x <= 100, true);
    assert.strictEqual(colors.includes(particle.color), true);
    assert.strictEqual(typeof particle.delay, "number");
    assert.strictEqual(typeof particle.rotation, "number");
    assert.strictEqual(typeof particle.scale, "number");
    assert.strictEqual(typeof particle.isRounded, "boolean");
  });

  await t.test("generateCursorStar creates valid star particle object", () => {
    const star = randomUtils.generateCursorStar(100, 200, 42);

    assert.strictEqual(star.id, 42);
    assert.strictEqual(star.x, 100);
    assert.strictEqual(star.y, 200);
    assert.strictEqual(star.opacity, 1);
    assert.strictEqual(typeof star.scale, "number");
    assert.strictEqual(star.scale >= 0.5 && star.scale <= 1.5, true);
  });
});
