import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getSecureRandom,
  clamp,
  shallowCloneArray,
  shuffleArray,
  randomUtils,
} from "./random.ts";

describe("random utilities", () => {
  describe("getSecureRandom", () => {
    it("returns a number between 0 (inclusive) and 1 (exclusive) using crypto", () => {
      for (let i = 0; i < 50; i++) {
        const val = getSecureRandom();
        assert.ok(val >= 0 && val < 1, `Expected ${val} to be between 0 and 1`);
      }
    });

    it("falls back to Math.random if crypto is undefined or missing getRandomValues", () => {
      const originalCrypto = globalThis.crypto;

      try {
        // Mock crypto being undefined
        Object.defineProperty(globalThis, "crypto", {
          value: undefined,
          configurable: true,
        });

        const val = getSecureRandom();
        assert.ok(val >= 0 && val < 1);

        // Mock crypto without getRandomValues
        Object.defineProperty(globalThis, "crypto", {
          value: {},
          configurable: true,
        });

        const val2 = getSecureRandom();
        assert.ok(val2 >= 0 && val2 < 1);
      } finally {
        Object.defineProperty(globalThis, "crypto", {
          value: originalCrypto,
          configurable: true,
        });
      }
    });

    it("uses Uint32Array and crypto.getRandomValues when available", () => {
      const originalCrypto = globalThis.crypto;

      try {
        let called = false;
        Object.defineProperty(globalThis, "crypto", {
          value: {
            getRandomValues: (arr: Uint32Array) => {
              called = true;
              arr[0] = 0x80000000; // Half of 0xffffffff + 1
              return arr;
            },
          },
          configurable: true,
        });

        const val = getSecureRandom();
        assert.strictEqual(called, true);
        assert.strictEqual(val, 0.5);
      } finally {
        Object.defineProperty(globalThis, "crypto", {
          value: originalCrypto,
          configurable: true,
        });
      }
    });

    it("handles crypto Uint32Array minimum (0) and maximum (0xffffffff) boundary values", () => {
      const originalCrypto = globalThis.crypto;

      try {
        // Test minimum boundary 0x00000000
        Object.defineProperty(globalThis, "crypto", {
          value: {
            getRandomValues: (arr: Uint32Array) => {
              arr[0] = 0;
              return arr;
            },
          },
          configurable: true,
        });
        assert.strictEqual(getSecureRandom(), 0);

        // Test maximum boundary 0xffffffff
        Object.defineProperty(globalThis, "crypto", {
          value: {
            getRandomValues: (arr: Uint32Array) => {
              arr[0] = 0xffffffff;
              return arr;
            },
          },
          configurable: true,
        });
        const maxVal = getSecureRandom();
        assert.ok(maxVal > 0.99999999);
        assert.ok(maxVal < 1.0);
        assert.strictEqual(maxVal, 0xffffffff / (0xffffffff + 1));
      } finally {
        Object.defineProperty(globalThis, "crypto", {
          value: originalCrypto,
          configurable: true,
        });
      }
    });
  });

  describe("clamp", () => {
    it("clamps values below min to min", () => {
      assert.strictEqual(clamp(-10, 0, 100), 0);
    });

    it("clamps values above max to max", () => {
      assert.strictEqual(clamp(150, 0, 100), 100);
    });

    it("returns value if within range", () => {
      assert.strictEqual(clamp(50, 0, 100), 50);
      assert.strictEqual(clamp(0, 0, 100), 0);
      assert.strictEqual(clamp(100, 0, 100), 100);
    });

    it("handles floating point values and identical min/max", () => {
      assert.strictEqual(clamp(10.5, 0.1, 10.4), 10.4);
      assert.strictEqual(clamp(-0.5, -0.4, 0.5), -0.4);
      assert.strictEqual(clamp(5, 10, 10), 10);
      assert.strictEqual(clamp(15, 10, 10), 10);
    });
  });

  describe("shallowCloneArray", () => {
    it("creates a new shallow copy of an array", () => {
      const original = [1, 2, 3];
      const clone = shallowCloneArray(original);

      assert.deepStrictEqual(clone, original);
      assert.notStrictEqual(clone, original);
    });
  });

  describe("shuffleArray", () => {
    it("returns a new array with the same elements without mutating the original", () => {
      const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const copy = [...original];

      const shuffled = shuffleArray(original);

      assert.strictEqual(shuffled.length, original.length);
      assert.notStrictEqual(shuffled, original);
      assert.deepStrictEqual(original, copy);

      // Verify all elements exist in shuffled
      const sortedOriginal = [...original].sort();
      const sortedShuffled = [...shuffled].sort();
      assert.deepStrictEqual(sortedShuffled, sortedOriginal);
    });

    it("handles empty arrays and single item arrays", () => {
      assert.deepStrictEqual(shuffleArray([]), []);
      assert.deepStrictEqual(shuffleArray([42]), [42]);
    });
  });

  describe("randomUtils", () => {
    it("randomItem returns an element from the array", () => {
      const arr = ["a", "b", "c"];
      for (let i = 0; i < 20; i++) {
        const item = randomUtils.randomItem(arr);
        assert.ok(arr.includes(item));
      }
    });

    it("randomItem returns undefined for empty array", () => {
      assert.strictEqual(randomUtils.randomItem([]), undefined);
    });

    it("randomRange returns a number within [min, max)", () => {
      const min = 10;
      const max = 20;
      for (let i = 0; i < 50; i++) {
        const val = randomUtils.randomRange(min, max);
        assert.ok(val >= min && val < max);
      }
    });

    it("randomRange handles identical min and max as well as negative ranges", () => {
      assert.strictEqual(randomUtils.randomRange(5, 5), 5);
      const negVal = randomUtils.randomRange(-20, -10);
      assert.ok(negVal >= -20 && negVal < -10);
    });

    it("randomInt returns an integer within [min, max)", () => {
      const min = 5;
      const max = 15;
      for (let i = 0; i < 50; i++) {
        const val = randomUtils.randomInt(min, max);
        assert.ok(Number.isInteger(val));
        assert.ok(val >= min && val < max);
      }
    });

    it("randomInt handles zero range min === max and negative range", () => {
      assert.strictEqual(randomUtils.randomInt(10, 10), 10);
      const negInt = randomUtils.randomInt(-10, -5);
      assert.ok(Number.isInteger(negInt));
      assert.ok(negInt >= -10 && negInt < -5);
    });

    it("randomBool returns a boolean value", () => {
      const results = new Set<boolean>();
      for (let i = 0; i < 100; i++) {
        results.add(randomUtils.randomBool());
      }
      assert.ok(results.has(true) || results.has(false));
    });

    it("randomBool evaluates threshold strictly (> 0.5 is true, <= 0.5 is false)", () => {
      const originalCrypto = globalThis.crypto;
      try {
        // Value <= 0.5 yields false
        Object.defineProperty(globalThis, "crypto", {
          value: {
            getRandomValues: (arr: Uint32Array) => {
              arr[0] = 0x80000000; // exactly 0.5
              return arr;
            },
          },
          configurable: true,
        });
        assert.strictEqual(randomUtils.randomBool(), false);

        // Value > 0.5 yields true
        Object.defineProperty(globalThis, "crypto", {
          value: {
            getRandomValues: (arr: Uint32Array) => {
              arr[0] = 0x80000001; // > 0.5
              return arr;
            },
          },
          configurable: true,
        });
        assert.strictEqual(randomUtils.randomBool(), true);
      } finally {
        Object.defineProperty(globalThis, "crypto", {
          value: originalCrypto,
          configurable: true,
        });
      }
    });

    it("generateConfettiParticle creates particle properties correctly", () => {
      const colors = ["red", "blue", "green"];
      const particle = randomUtils.generateConfettiParticle(123, colors);

      assert.strictEqual(particle.id, 123);
      assert.ok(particle.x >= 0 && particle.x < 100);
      assert.ok(colors.includes(particle.color));
      assert.ok(particle.delay >= 0 && particle.delay < 0.5);
      assert.ok(particle.rotation >= 0 && particle.rotation < 360);
      assert.ok(particle.scale >= 0.5 && particle.scale < 1.0);
      assert.strictEqual(typeof particle.isRounded, "boolean");
    });

    it("generateConfettiParticle handles single-color array and empty color array safely", () => {
      const singleColorParticle = randomUtils.generateConfettiParticle(1, ["purple"]);
      assert.strictEqual(singleColorParticle.color, "purple");

      const emptyColorParticle = randomUtils.generateConfettiParticle(2, []);
      assert.strictEqual(emptyColorParticle.color, undefined);
    });

    it("generateCursorStar creates cursor star properties correctly", () => {
      const star = randomUtils.generateCursorStar(100, 200, 456);

      assert.strictEqual(star.id, 456);
      assert.strictEqual(star.x, 100);
      assert.strictEqual(star.y, 200);
      assert.strictEqual(star.opacity, 1);
      assert.ok(star.scale >= 0.5 && star.scale < 1.5);
    });

    it("calculates deterministic range and particle outputs when mocked", () => {
      const originalCrypto = globalThis.crypto;
      try {
        // Mock getSecureRandom to return 0.5
        Object.defineProperty(globalThis, "crypto", {
          value: {
            getRandomValues: (arr: Uint32Array) => {
              arr[0] = 0x80000000; // Exact 0.5
              return arr;
            },
          },
          configurable: true,
        });

        assert.strictEqual(randomUtils.randomRange(10, 20), 15);
        assert.strictEqual(randomUtils.randomInt(10, 20), 15);
        assert.strictEqual(randomUtils.randomBool(), false); // 0.5 > 0.5 is false

        const particle = randomUtils.generateConfettiParticle(1, ["#fff"]);
        assert.strictEqual(particle.x, 50);
        assert.strictEqual(particle.delay, 0.25);
        assert.strictEqual(particle.rotation, 180);
        assert.strictEqual(particle.scale, 0.75);

        const star = randomUtils.generateCursorStar(10, 20, 2);
        assert.strictEqual(star.scale, 1.0);
      } finally {
        Object.defineProperty(globalThis, "crypto", {
          value: originalCrypto,
          configurable: true,
        });
      }
    });
  });
});
