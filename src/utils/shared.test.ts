import test from "node:test";
import assert from "node:assert";
import { deepClone } from "./shared.ts";

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
    // @ts-ignore
    globalThis.structuredClone = undefined;

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
