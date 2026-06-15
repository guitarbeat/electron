import assert from "node:assert/strict";
import test from "node:test";
import { clamp, deepClone } from "./shared.ts";

test("clamp", async (t) => {
  await t.test("returns the value when it is within the range", () => {
    assert.equal(clamp(5, 0, 10), 5);
  });

  await t.test("returns the min value when the value is below the min", () => {
    assert.equal(clamp(-5, 0, 10), 0);
  });

  await t.test("returns the max value when the value is above the max", () => {
    assert.equal(clamp(15, 0, 10), 10);
  });

  await t.test("returns the min value when the value is equal to the min", () => {
    assert.equal(clamp(0, 0, 10), 0);
  });

  await t.test("returns the max value when the value is equal to the max", () => {
    assert.equal(clamp(10, 0, 10), 10);
  });

  await t.test("works correctly with negative ranges", () => {
    assert.equal(clamp(-15, -20, -10), -15);
    assert.equal(clamp(-25, -20, -10), -20);
    assert.equal(clamp(-5, -20, -10), -10);
  });
});

test("deepClone", async (t) => {
  await t.test("clones a simple object", () => {
    const obj = { a: 1, b: 2 };
    const cloned = deepClone(obj);
    assert.deepEqual(cloned, obj);
    assert.notStrictEqual(cloned, obj);
  });

  await t.test("clones an array", () => {
    const arr = [1, 2, 3];
    const cloned = deepClone(arr);
    assert.deepEqual(cloned, arr);
    assert.notStrictEqual(cloned, arr);
  });

  await t.test("clones a nested object", () => {
    const obj = { a: { b: 2 } };
    const cloned = deepClone(obj);
    assert.deepEqual(cloned, obj);
    assert.notStrictEqual(cloned, obj);
    assert.notStrictEqual(cloned.a, obj.a);
  });

  await t.test("falls back to JSON methods when structuredClone is unavailable", () => {
    const originalStructuredClone = globalThis.structuredClone;
    globalThis.structuredClone = undefined as typeof structuredClone;

    try {
      const obj = { a: { b: 2 } };
      const cloned = deepClone(obj);
      assert.deepEqual(cloned, obj);
      assert.notStrictEqual(cloned, obj);
      assert.notStrictEqual(cloned.a, obj.a);
    } finally {
      globalThis.structuredClone = originalStructuredClone;
    }
  });
});
