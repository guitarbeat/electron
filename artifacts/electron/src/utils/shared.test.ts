import test, { mock } from "node:test";
import assert from "node:assert/strict";
import {
  areDeeplyEqual,
  concurrentMap,
  createValidator,
  executeAction,
  isValidUrl,
  consoleError,
  parseJsonContent,
  sanitizeInput,
  shuffleArray,
  decodeStorageData,
  encodeStorageData,
  formatMemoryTimestamp,
} from "./shared.ts";

test("areDeeplyEqual", async (t) => {
  const testCases = [
    // Primitives
    {
      name: "returns true for identical primitives - number",
      left: 1,
      right: 1,
      expected: true,
    },
    {
      name: "returns true for identical primitives - string",
      left: "hello",
      right: "hello",
      expected: true,
    },
    {
      name: "returns true for identical primitives - boolean",
      left: true,
      right: true,
      expected: true,
    },
    {
      name: "returns true for identical primitives - null",
      left: null,
      right: null,
      expected: true,
    },
    {
      name: "returns true for identical primitives - undefined",
      left: undefined,
      right: undefined,
      expected: true,
    },
    {
      name: "returns false for different primitives - number",
      left: 1,
      right: 2,
      expected: false,
    },
    {
      name: "returns false for different primitives - string",
      left: "hello",
      right: "world",
      expected: false,
    },
    {
      name: "returns false for different primitives - boolean",
      left: true,
      right: false,
      expected: false,
    },
    {
      name: "returns false for different primitives - null vs undefined",
      left: null,
      right: undefined,
      expected: false,
    },
    {
      name: "returns false for different primitives - number vs string",
      left: 1,
      right: "1" as unknown as number,
      expected: false,
    },

    // Objects
    {
      name: "returns true for deeply equal objects - empty",
      left: {},
      right: {},
      expected: true,
    },
    {
      name: "returns true for deeply equal objects - simple",
      left: { a: 1, b: 2 },
      right: { a: 1, b: 2 },
      expected: true,
    },
    {
      name: "returns true for deeply equal objects - unordered keys",
      left: { a: 1, b: 2 },
      right: { b: 2, a: 1 },
      expected: true,
    },
    {
      name: "returns true for deeply equal objects - nested",
      left: { a: { b: 1 } },
      right: { a: { b: 1 } },
      expected: true,
    },
    {
      name: "returns false for different objects - different values",
      left: { a: 1 },
      right: { a: 2 },
      expected: false,
    },
    {
      name: "returns false for different objects - different keys",
      left: { a: 1 },
      right: { b: 1 },
      expected: false,
    },
    {
      name: "returns false for different objects - missing key",
      left: { a: 1 },
      right: { a: 1, b: 2 },
      expected: false,
    },
    {
      name: "returns false for different objects - nested difference",
      left: { a: { b: 1 } },
      right: { a: { b: 2 } },
      expected: false,
    },

    // Arrays
    {
      name: "returns true for deeply equal arrays - empty",
      left: [],
      right: [],
      expected: true,
    },
    {
      name: "returns true for deeply equal arrays - simple",
      left: [1, 2, 3],
      right: [1, 2, 3],
      expected: true,
    },
    {
      name: "returns true for deeply equal arrays - objects",
      left: [{ a: 1 }],
      right: [{ a: 1 }],
      expected: true,
    },
    {
      name: "returns true for deeply equal arrays - nested",
      left: [[1]],
      right: [[1]],
      expected: true,
    },
    {
      name: "returns false for different arrays - length",
      left: [1, 2],
      right: [1, 2, 3],
      expected: false,
    },
    {
      name: "returns false for different arrays - order",
      left: [1, 2],
      right: [2, 1],
      expected: false,
    },
    {
      name: "returns false for different arrays - object content",
      left: [{ a: 1 }],
      right: [{ a: 2 }],
      expected: false,
    },

    // Mixed & Edge Cases
    {
      name: "handles mixed structures - equal",
      left: { a: [1, { b: 2 }], c: "hello", d: null },
      right: { a: [1, { b: 2 }], c: "hello", d: null },
      expected: true,
    },
    {
      name: "handles mixed structures - not equal",
      left: { a: [1, { b: 2 }], c: "hello", d: null },
      right: { a: [1, { b: 2 }], c: "hello", d: undefined as unknown as null },
      expected: false,
    },
    {
      name: "handles type mismatches - object vs array",
      left: {} as unknown,
      right: [] as unknown,
      expected: false,
    },
    {
      name: "handles type mismatches - null vs object",
      left: null as unknown,
      right: {} as unknown,
      expected: false,
    },
    {
      name: "handles type mismatches - number vs object",
      left: 1 as unknown,
      right: { a: 1 } as unknown,
      expected: false,
    },
  ];

  for (const tc of testCases) {
    await t.test(tc.name, () => {
      assert.strictEqual(areDeeplyEqual(tc.left, tc.right), tc.expected);
    });
  }
});
test("executeAction", async (t) => {
  await t.test("runs action and completion in order", () => {
    const calls: string[] = [];

    executeAction(
      () => {
        calls.push("action");
      },
      () => {
        calls.push("complete");
      },
    );

    assert.deepEqual(calls, ["action", "complete"]);
  });

  await t.test("still runs completion when action is missing", () => {
    const calls: string[] = [];

    executeAction(undefined, () => {
      calls.push("complete");
    });

    assert.deepEqual(calls, ["complete"]);
  });
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
      // URL constructor throws for protocol-relative unless base is provided
      assert.equal(isValidUrl("/" + "/example.com"), false);
    },
  );
});

test("sanitizeInput", async (t) => {
  await t.test("returns empty string for empty inputs", () => {
    assert.equal(sanitizeInput(""), "");
    // @ts-expect-error Testing invalid runtime input
    assert.equal(sanitizeInput(null), "");
    // @ts-expect-error Testing invalid runtime input
    assert.equal(sanitizeInput(undefined), "");
  });

  await t.test("trims leading and trailing whitespace", () => {
    assert.equal(sanitizeInput("  hello world  "), "hello world");
    assert.equal(sanitizeInput("\t\n hello \t\n"), "hello");
  });

  await t.test("removes control characters", () => {
    assert.equal(sanitizeInput("hello\x00world"), "helloworld");
    assert.equal(sanitizeInput("test\x0B\x0Cdata"), "testdata");
    assert.equal(sanitizeInput("abc\x1Fdef\x7Fghi"), "abcdefghi");
  });

  await t.test("keeps normal characters aside from trimming", () => {
    assert.equal(
      sanitizeInput("regular string with numbers 123 and symbols !@#"),
      "regular string with numbers 123 and symbols !@#",
    );
  });

  await t.test(
    "returns empty string for control characters and whitespace only",
    () => {
      assert.equal(sanitizeInput("\x00\x08 \t\n\x7F"), "");
    },
  );
});

test("parseJsonContent", async (t) => {
  await t.test("parses valid JSON string correctly", () => {
    const json = '{"key": "value", "number": 42}';
    assert.deepEqual(parseJsonContent(json, "TestContext"), {
      key: "value",
      number: 42,
    });
  });

  await t.test("throws an error with context for invalid JSON", () => {
    const invalidJson = '{key: "value"}';
    assert.throws(
      () => parseJsonContent(invalidJson, "TestContext"),
      (err) => {
        return (
          err instanceof Error &&
          err.message === "Failed to parse TestContext JSON." &&
          err.cause instanceof SyntaxError
        );
      },
    );
  });
});

test("createValidator", async (t) => {
  await t.test("validates valid data successfully", () => {
    const validator = createValidator({
      name: { required: true, maxLength: 50 },
      age: {
        custom: (val) =>
          Number.isNaN(Number(val)) ? "Must be a number" : null,
      },
    });

    const result = validator({ name: "John Doe", age: "30" });
    assert.equal(result.isValid, true);
    assert.deepEqual(result.errors, {});
    assert.deepEqual(result.fieldErrors, []);
  });

  await t.test("enforces required rule", () => {
    const validator = createValidator({
      name: { required: true, message: "Name is mandatory" },
      optional: { required: false },
    });

    const result = validator({ optional: "present" });
    assert.equal(result.isValid, false);
    assert.deepEqual(result.errors, { name: "Name is mandatory" });
    assert.deepEqual(result.fieldErrors, ["Name is mandatory"]);
  });

  await t.test("enforces maxLength rule", () => {
    const validator = createValidator({
      code: { maxLength: 3 },
    });

    const result = validator({ code: "ABCD" });
    assert.equal(result.isValid, false);
    assert.deepEqual(result.errors, {
      code: "code exceeds maximum length of 3 characters",
    });
  });

  await t.test("enforces minLength rule", () => {
    const validator = createValidator({
      pin: { minLength: 4 },
    });

    const result = validator({ pin: "123" });
    assert.equal(result.isValid, false);
    assert.deepEqual(result.errors, {
      pin: "pin must be at least 4 characters",
    });
  });

  await t.test("enforces pattern rule", () => {
    const validator = createValidator({
      email: { pattern: /^[^@]+@[^@]+\.[^@]+$/ },
    });

    const result = validator({ email: "invalid-email" });
    assert.equal(result.isValid, false);
    assert.deepEqual(result.errors, { email: "email format is invalid" });
  });

  await t.test("enforces custom rule", () => {
    const validator = createValidator({
      username: {
        custom: (val) => (val === "admin" ? "Reserved username" : null),
      },
    });

    const result = validator({ username: "admin" });
    assert.equal(result.isValid, false);
    assert.deepEqual(result.errors, { username: "Reserved username" });
  });

  await t.test("trims whitespace before validation", () => {
    const validator = createValidator({
      name: { required: true },
      code: { maxLength: 3 },
    });

    const resultEmpty = validator({ name: "   " });
    assert.equal(resultEmpty.isValid, false);
    assert.equal(resultEmpty.errors.name, "name is required");

    const resultLength = validator({ name: "Valid", code: "  AB  " });
    assert.equal(resultLength.isValid, true);
  });

  await t.test("ignores missing non-required fields", () => {
    const validator = createValidator({
      bio: { maxLength: 10 }, // Not required
    });

    const result = validator({}); // Missing
    assert.equal(result.isValid, true);

    const resultEmpty = validator({ bio: "" }); // Empty
    assert.equal(resultEmpty.isValid, true);
  });

  await t.test("coerces non-string values to string", () => {
    const validator = createValidator({
      count: { minLength: 2 },
    });

    // Number 5 will be coerced to "5", which is 1 char (less than minLength 2)
    const result = validator({ count: 5 });
    assert.equal(result.isValid, false);
    assert.equal(result.errors.count, "count must be at least 2 characters");
  });

  await t.test("accumulates multiple errors across different fields", () => {
    const validator = createValidator({
      name: { required: true },
      age: { required: true },
    });

    const result = validator({});
    assert.equal(result.isValid, false);
    assert.equal(Object.keys(result.errors).length, 2);
    assert.equal(result.fieldErrors.length, 2);
  });
});

test("concurrentMap", async (t) => {
  await t.test("returns empty array when given empty items list", async () => {
    const results = await concurrentMap([], 2, async (val) => val);
    assert.deepEqual(results, []);
  });

  await t.test("maps items correctly", async () => {
    const items = [1, 2, 3, 4, 5];
    const results = await concurrentMap(items, 2, async (item) => item * 2);
    assert.deepEqual(results, [2, 4, 6, 8, 10]);
  });

  await t.test("respects concurrency limit", async () => {
    const items = Array.from({ length: 10 }, (_, i) => i);
    let activeTasks = 0;
    let maxActiveTasks = 0;

    const fn = async (item: number) => {
      activeTasks++;
      if (activeTasks > maxActiveTasks) {
        maxActiveTasks = activeTasks;
      }
      // Small delay to allow overlap
      await new Promise((resolve) => setTimeout(resolve, 10));
      activeTasks--;
      return item * 2;
    };

    const results = await concurrentMap(items, 3, fn);

    assert.deepEqual(
      results,
      items.map((i) => i * 2),
    );
    assert.ok(
      maxActiveTasks <= 3,
      `Max active tasks (\${maxActiveTasks}) exceeded concurrency limit (3)`,
    );
    assert.equal(activeTasks, 0, "All tasks should have finished");
  });

  await t.test("handles concurrency larger than items length", async () => {
    const items = [1, 2];
    let activeTasks = 0;
    let maxActiveTasks = 0;

    const fn = async (item: number) => {
      activeTasks++;
      if (activeTasks > maxActiveTasks) {
        maxActiveTasks = activeTasks;
      }
      await new Promise((resolve) => setTimeout(resolve, 5));
      activeTasks--;
      return item * 2;
    };

    const results = await concurrentMap(items, 10, fn);
    assert.deepEqual(results, [2, 4]);
    assert.ok(maxActiveTasks <= 2, "Should not start more tasks than items");
  });

  await t.test("rejects if a task fails", async () => {
    const items = [1, 2, 3, 4, 5];

    await assert.rejects(
      async () => {
        await concurrentMap(items, 2, async (item) => {
          if (item === 3) throw new Error("Task failed");
          return item;
        });
      },
      (err) => err instanceof Error && err.message === "Task failed",
    );
  });
});

test("layouts", async (t) => {
  const { spacing } = await import("../theme/tokens.ts");
  const { layouts } = await import("./shared.ts");

  await t.test("centeredContainer returns expected static object", () => {
    assert.deepEqual(layouts.centeredContainer, {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: `0 ${spacing.md}`,
    });
  });

  await t.test("grid returns correct styles with default params", () => {
    assert.deepEqual(layouts.grid(), {
      display: "grid",
      gridTemplateColumns: "repeat(1, 1fr)",
      gap: spacing.md,
    });
  });

  await t.test("grid returns correct styles with custom params", () => {
    assert.deepEqual(layouts.grid(3, "24px"), {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "24px",
    });
  });

  await t.test("stack returns correct styles with default gap", () => {
    assert.deepEqual(layouts.stack(), {
      display: "flex",
      flexDirection: "column",
      gap: spacing.md,
    });
  });

  await t.test("stack returns correct styles with custom gap", () => {
    assert.deepEqual(layouts.stack("8px"), {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    });
  });
});

test("consoleError", async (t) => {
  await t.test("logs only message and error if no details exist", () => {
    const m = mock.method(console, "error", () => {});
    try {
      consoleError("Test message", "Test error");
      assert.equal(m.mock.calls.length, 1);
      assert.deepEqual(m.mock.calls[0].arguments, [
        "Test message",
        "Test error",
      ]);
    } finally {
      m.mock.restore();
    }
  });

  await t.test("logs details if context is provided", () => {
    const m = mock.method(console, "error", () => {});
    try {
      consoleError("Test message", "Test error", { extra: "data" });
      assert.equal(m.mock.calls.length, 1);
      assert.deepEqual(m.mock.calls[0].arguments, [
        "Test message",
        "Test error",
        { extra: "data" },
      ]);
    } finally {
      m.mock.restore();
    }
  });

  await t.test("extracts status, code, and conflict from error object", () => {
    const m = mock.method(console, "error", () => {});
    try {
      const errorObj = {
        status: 404,
        code: "NOT_FOUND",
        conflict: true,
        other: "ignored",
      };
      consoleError("Test message", errorObj);
      assert.equal(m.mock.calls.length, 1);
      assert.deepEqual(m.mock.calls[0].arguments, [
        "Test message",
        errorObj,
        { status: 404, code: "NOT_FOUND", conflict: true },
      ]);
    } finally {
      m.mock.restore();
    }
  });

  await t.test("merges extracted error properties with context", () => {
    const m = mock.method(console, "error", () => {});
    try {
      const errorObj = { status: 500 };
      consoleError("Test message", errorObj, { request_id: "123" });
      assert.equal(m.mock.calls.length, 1);
      assert.deepEqual(m.mock.calls[0].arguments, [
        "Test message",
        errorObj,
        {
          status: 500,
          code: undefined,
          conflict: undefined,
          request_id: "123",
        },
      ]);
    } finally {
      m.mock.restore();
    }
  });

  await t.test("handles null error gracefully", () => {
    const m = mock.method(console, "error", () => {});
    try {
      consoleError("Test message", null, { extra: "data" });
      assert.equal(m.mock.calls.length, 1);
      assert.deepEqual(m.mock.calls[0].arguments, [
        "Test message",
        null,
        { extra: "data" },
      ]);
    } finally {
      m.mock.restore();
    }
  });

  await t.test("handles undefined error gracefully", () => {
    const m = mock.method(console, "error", () => {});
    try {
      consoleError("Test message", undefined);
      assert.equal(m.mock.calls.length, 1);
      assert.deepEqual(m.mock.calls[0].arguments, [
        "Test message",
        undefined,
      ]);
    } finally {
      m.mock.restore();
    }
  });

});

test("encodeStorageData and decodeStorageData", async (t) => {
  await t.test("encodes and decodes data correctly", () => {
    const original = JSON.stringify({ foo: "bar", secret: 123 });
    const encoded = encodeStorageData(original);

    assert.notEqual(original, encoded);
    assert.ok(encoded.startsWith("v1:"));

    const decoded = decodeStorageData(encoded);
    assert.equal(original, decoded);
    assert.deepEqual(JSON.parse(decoded), { foo: "bar", secret: 123 });
  });

  await t.test("handles legacy plaintext data", () => {
    const legacy = JSON.stringify({ legacy: true });
    const decoded = decodeStorageData(legacy);
    assert.equal(legacy, decoded);
  });

  await t.test("handles non-JSON versioned data", () => {
    const original = "plain text";
    const encoded = encodeStorageData(original);
    const decoded = decodeStorageData(encoded);
    assert.equal(original, decoded);
  });

  await t.test("gracefully handles malformed v1: data", () => {
    const malformed = "v1:!!!not-base64!!!";
    const decoded = decodeStorageData(malformed);
    assert.equal(malformed, decoded);
  });

  await t.test("handles empty data", () => {
    assert.equal(decodeStorageData(""), "");
  });

  await t.test(
    "gracefully handles natively invalid base64 (e.g. throws DOMException)",
    () => {
      // atob natively throws if string length is not valid for base64 or has other invalid traits
      // like 'a' which is length 1. It matches regex but throws InvalidCharacterError.
      const invalidBase64 = "v1:a";
      const decoded = decodeStorageData(invalidBase64);
      assert.equal(invalidBase64, decoded);
    },
  );

  await t.test(
    "encodeStorageData gracefully handles natively invalid string (e.g. throws DOMException)",
    () => {
      // btoa natively throws if string contains characters outside the Latin1 range.
      const invalidLatin1 = "\uD800\uDC00";
      const encoded = encodeStorageData(invalidLatin1);
      assert.equal(invalidLatin1, encoded);
    },
  );
});


test('formatMemoryTimestamp', async (t) => {
  const originalTz = process.env.TZ;

  t.beforeEach(() => {
    process.env.TZ = 'UTC';
  });

  t.afterEach(() => {
    process.env.TZ = originalTz;
  });

  await t.test('formats a valid date string correctly', () => {
    const result = formatMemoryTimestamp('2025-01-05T15:45:00Z');
    // In node's UTC locale string it should be "Jan 5, 2025, 3:45 PM"
    assert.equal(result, 'Jan 5, 2025, 3:45 PM');
  });

  await t.test('handles different months and days', () => {
    const result = formatMemoryTimestamp('2024-12-31T08:30:00Z');
    assert.equal(result, 'Dec 31, 2024, 8:30 AM');
  });

  await t.test('returns "Unknown date" for invalid date strings', () => {
    const result = formatMemoryTimestamp('invalid-date');
    assert.equal(result, 'Unknown date');
  });

  await t.test('returns "Unknown date" for empty strings', () => {
    const result = formatMemoryTimestamp('');
    assert.equal(result, 'Unknown date');
  });
});

test("shuffleArray", async (t) => {
  await t.test("returns an empty array when given an empty array", () => {
    const arr: number[] = [];
    const result = shuffleArray(arr);
    assert.deepEqual(result, []);
    assert.notEqual(result, arr);
  });

  await t.test("returns an array with the same single element", () => {
    const arr = [42];
    const result = shuffleArray(arr);
    assert.deepEqual(result, [42]);
    assert.notEqual(result, arr);
  });

  await t.test("returns a new array and does not mutate the original", () => {
    const arr = [1, 2, 3, 4, 5];
    const arrCopy = [...arr];
    const result = shuffleArray(arr);

    assert.notEqual(result, arr);
    assert.deepEqual(arr, arrCopy, "Original array was mutated");
  });

  await t.test("retains all original elements", () => {
    const arr = [1, 2, 3, 4, 5];
    const result = shuffleArray(arr);

    assert.equal(result.length, arr.length);
    for (const item of arr) {
      assert.equal(result.includes(item), true);
    }
  });

  await t.test("produces different permutations over multiple runs", () => {
    // There is a tiny chance that shuffling a large array yields the exact same order.
    // So we'll shuffle it a few times and ensure at least one result differs from the original.
    const arr = Array.from({ length: 20 }, (_, i) => i);
    let allSame = true;

    for (let i = 0; i < 5; i++) {
      const result = shuffleArray(arr);
      if (JSON.stringify(result) !== JSON.stringify(arr)) {
        allSame = false;
        break;
      }
    }

    assert.equal(allSame, false, "shuffleArray returned the exact same order 5 times in a row for a 20-element array");
  });
});


test('shuffleArray', async (t) => {
  await t.test('returns empty array when given empty array', () => {
    assert.deepEqual(shuffleArray([]), []);
  });

  await t.test('returns same single element for array of length 1', () => {
    assert.deepEqual(shuffleArray([1]), [1]);
  });

  await t.test('does not mutate original array', () => {
    const original = [1, 2, 3];
    const shuffled = shuffleArray(original);
    assert.notStrictEqual(shuffled, original);
    assert.deepEqual(original, [1, 2, 3]);
  });

  await t.test('contains all original elements', () => {
    const original = [1, 2, 3, 4, 5];
    const shuffled = shuffleArray(original);
    assert.equal(shuffled.length, original.length);
    for (const item of original) {
      assert.ok(shuffled.includes(item));
    }
  });

  await t.test('shuffles array based on pseudo-random values', () => {
    const original = [1, 2, 3, 4, 5];
    let m;
    if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.getRandomValues) {
      m = mock.method(globalThis.crypto, 'getRandomValues', (arr) => {
        arr[0] = 0; // Ensures getSecureRandom returns 0
        return arr;
      });
    }

    try {
      const shuffled = shuffleArray(original);
      // For j always 0:
      // i=4, j=0: [shuffled[4], shuffled[0]] = [1, 5] -> [5, 2, 3, 4, 1]
      // i=3, j=0: [shuffled[3], shuffled[0]] = [5, 4] -> [4, 2, 3, 5, 1]
      // i=2, j=0: [shuffled[2], shuffled[0]] = [4, 3] -> [3, 2, 4, 5, 1]
      // i=1, j=0: [shuffled[1], shuffled[0]] = [3, 2] -> [2, 3, 4, 5, 1]
      if (m) {
        assert.deepEqual(shuffled, [2, 3, 4, 5, 1]);
      }
    } finally {
      if (m) m.mock.restore();
    }
  });
});
