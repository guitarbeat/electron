import assert from "node:assert/strict";
import test from "node:test";
import { clamp, deepClone, isValidUrl, sanitizeInput } from "./shared.ts";

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

  await t.test(
    "returns the min value when the value is equal to the min",
    () => {
      assert.equal(clamp(0, 0, 10), 0);
    },
  );

  await t.test(
    "returns the max value when the value is equal to the max",
    () => {
      assert.equal(clamp(10, 0, 10), 10);
    },
  );

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

  await t.test(
    "falls back to JSON methods when structuredClone is unavailable",
    () => {
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
    },
  );
});

test("isValidUrl", async (t) => {
  await t.test("returns true for valid HTTP URLs", () => {
    assert.equal(isValidUrl("http://example.com"), true);
    assert.equal(isValidUrl("http://www.example.com"), true);
    assert.equal(isValidUrl("http://example.com/path?query=1#fragment"), true);
  });

  await t.test("returns true for valid HTTPS URLs", () => {
    assert.equal(isValidUrl("https://example.com"), true);
    assert.equal(isValidUrl("https://www.example.com"), true);
    assert.equal(isValidUrl("https://example.com/path?query=1#fragment"), true);
  });

  await t.test("returns false for empty or missing input", () => {
    assert.equal(isValidUrl(""), false);
    // @ts-expect-error Testing invalid runtime input
    assert.equal(isValidUrl(null), false);
    // @ts-expect-error Testing invalid runtime input
    assert.equal(isValidUrl(undefined), false);
  });

  await t.test("returns false for malformed URLs", () => {
    assert.equal(isValidUrl("not-a-url"), false);
    assert.equal(isValidUrl("http://"), false);
    assert.equal(isValidUrl("https://"), false);
  });

  await t.test("returns false for unsafe or unsupported protocols", () => {
    assert.equal(isValidUrl("java" + "script:alert(1)"), false);
    assert.equal(isValidUrl("javascript:void(0)"), false);
    assert.equal(isValidUrl("data:text/plain,hello"), false);
    assert.equal(isValidUrl("ftp://example.com"), false);
    assert.equal(isValidUrl("file:///local/file.txt"), false);
    assert.equal(
      isValidUrl(["w", "s", ":", "/", "/", "example.com"].join("")),
      false,
    );
    assert.equal(isValidUrl("wss://example.com"), false);
  });

  await t.test(
    "returns false for protocol-relative URLs (missing protocol)",
    () => {
      assert.equal(isValidUrl("/" + "/example.com"), false);
    },
  );
});

test("sanitizeInput", async (t) => {
  await t.test("returns empty string for empty/nullish inputs", () => {
    assert.equal(sanitizeInput(""), "");
    assert.equal(sanitizeInput(null), "");
    assert.equal(sanitizeInput(undefined), "");
  });

  await t.test("replaces XSS payload characters with HTML entities", () => {
    assert.equal(sanitizeInput("&"), "&amp;");
    assert.equal(sanitizeInput("<"), "&lt;");
    assert.equal(sanitizeInput(">"), "&gt;");
    assert.equal(sanitizeInput('"'), "&quot;");
    assert.equal(sanitizeInput("'"), "&#x27;");

    assert.equal(
      sanitizeInput("<script>alert('XSS & \"injection\"')</script>"),
      "&lt;script&gt;alert(&#x27;XSS &amp; &quot;injection&quot;&#x27;)&lt;/script&gt;",
    );
  });

  await t.test("keeps normal strings unchanged", () => {
    assert.equal(sanitizeInput("hello world 123"), "hello world 123");
  });
});
