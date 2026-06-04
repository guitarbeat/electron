import { mock } from 'node:test';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  layouts,
  areDeeplyEqual,
  concurrentMap,
  createValidator,
  executeAction,
  getErrorMessage,
  isValidUrl,
  normalizeMovieTitle,
  parseJsonContent,
  readApiErrorMessage,
  sanitizeInput,
} from "./shared.ts";

test("areDeeplyEqual", async (t) => {
  await t.test("returns true for identical primitives", () => {
    assert.strictEqual(areDeeplyEqual(1, 1), true);
    assert.strictEqual(areDeeplyEqual("hello", "hello"), true);
    assert.strictEqual(areDeeplyEqual(true, true), true);
    assert.strictEqual(areDeeplyEqual(null, null), true);
    assert.strictEqual(areDeeplyEqual(undefined, undefined), true);
  });

  await t.test("returns false for different primitives", () => {
    assert.strictEqual(areDeeplyEqual(1, 2), false);
    assert.strictEqual(areDeeplyEqual("hello", "world"), false);
    assert.strictEqual(areDeeplyEqual(true, false), false);
    assert.strictEqual(areDeeplyEqual(null, undefined), false);
    assert.strictEqual(areDeeplyEqual(1, "1" as unknown as number), false);
  });

  await t.test("returns true for deeply equal objects", () => {
    assert.strictEqual(areDeeplyEqual({}, {}), true);
    assert.strictEqual(areDeeplyEqual({ a: 1, b: 2 }, { a: 1, b: 2 }), true);
    assert.strictEqual(areDeeplyEqual({ a: 1, b: 2 }, { b: 2, a: 1 }), true);
    assert.strictEqual(areDeeplyEqual({ a: { b: 1 } }, { a: { b: 1 } }), true);
  });

  await t.test("returns false for different objects", () => {
    assert.strictEqual(areDeeplyEqual({ a: 1 }, { a: 2 }), false);
    assert.strictEqual(areDeeplyEqual({ a: 1 }, { b: 1 }), false);
    assert.strictEqual(areDeeplyEqual({ a: 1 }, { a: 1, b: 2 }), false);
    assert.strictEqual(areDeeplyEqual({ a: { b: 1 } }, { a: { b: 2 } }), false);
  });

  await t.test("returns true for deeply equal arrays", () => {
    assert.strictEqual(areDeeplyEqual([], []), true);
    assert.strictEqual(areDeeplyEqual([1, 2, 3], [1, 2, 3]), true);
    assert.strictEqual(areDeeplyEqual([{ a: 1 }], [{ a: 1 }]), true);
    assert.strictEqual(areDeeplyEqual([[1]], [[1]]), true);
  });

  await t.test("returns false for different arrays", () => {
    assert.strictEqual(areDeeplyEqual([1, 2], [1, 2, 3]), false);
    assert.strictEqual(areDeeplyEqual([1, 2], [2, 1]), false);
    assert.strictEqual(areDeeplyEqual([{ a: 1 }], [{ a: 2 }]), false);
  });

  await t.test("handles mixed structures", () => {
    const left = {
      a: [1, { b: 2 }],
      c: "hello",
      d: null,
    };
    const right = {
      a: [1, { b: 2 }],
      c: "hello",
      d: null,
    };
    assert.strictEqual(areDeeplyEqual(left, right), true);

    const different = { ...right, d: undefined as unknown as null };
    assert.strictEqual(areDeeplyEqual(left, different), false);
  });

  await t.test("handles type mismatches", () => {
    assert.strictEqual(areDeeplyEqual({} as unknown, [] as unknown), false);
    assert.strictEqual(areDeeplyEqual(null as unknown, {} as unknown), false);
    assert.strictEqual(
      areDeeplyEqual(1 as unknown, { a: 1 } as unknown),
      false,
    );
  });
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

  await t.test('inlineStack returns correct styles with default gap', () => {
    assert.deepEqual(layouts.inlineStack(), {
      display: 'flex',
      alignItems: 'center',
      gap: spacing.md,
    });
  });

  await t.test('inlineStack returns correct styles with custom gap', () => {
    assert.deepEqual(layouts.inlineStack('32px'), {
      display: 'flex',
      alignItems: 'center',
      gap: '32px',
    });
  });

  await t.test('flexRow returns correct styles with default params', () => {
    assert.deepEqual(layouts.flexRow(), {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
      gap: spacing.md,
    });
  });

  await t.test('flexRow returns correct styles with custom params', () => {
    assert.deepEqual(layouts.flexRow('space-between', 'flex-start', '10px'), {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: '10px',
    });
  });
});


test('randomUtils', async (t) => {
  const { randomUtils } = await import('./shared.ts');

  await t.test('randomItem', () => {
    const array = ['a', 'b', 'c', 'd'];
    const randomMock = mock.method(Math, 'random', () => 0); // 0 * 4 = 0 -> 'a'
    assert.equal(randomUtils.randomItem(array), 'a');
    randomMock.mock.restore();

    const randomMock2 = mock.method(Math, 'random', () => 0.5); // 0.5 * 4 = 2 -> 'c'
    assert.equal(randomUtils.randomItem(array), 'c');
    randomMock2.mock.restore();

    const randomMock3 = mock.method(Math, 'random', () => 0.999); // 0.999 * 4 = 3.996 -> 'd'
    assert.equal(randomUtils.randomItem(array), 'd');
    randomMock3.mock.restore();
  });

  await t.test('randomRange', () => {
    const randomMock = mock.method(Math, 'random', () => 0);
    assert.equal(randomUtils.randomRange(5, 10), 5);
    randomMock.mock.restore();

    const randomMock2 = mock.method(Math, 'random', () => 0.5);
    assert.equal(randomUtils.randomRange(5, 10), 7.5);
    randomMock2.mock.restore();

    const randomMock3 = mock.method(Math, 'random', () => 1);
    assert.equal(randomUtils.randomRange(5, 10), 10);
    randomMock3.mock.restore();
  });

  await t.test('randomInt', () => {
    const randomMock = mock.method(Math, 'random', () => 0);
    assert.equal(randomUtils.randomInt(5, 10), 5);
    randomMock.mock.restore();

    const randomMock2 = mock.method(Math, 'random', () => 0.5);
    assert.equal(randomUtils.randomInt(5, 10), 7);
    randomMock2.mock.restore();

    const randomMock3 = mock.method(Math, 'random', () => 0.999);
    assert.equal(randomUtils.randomInt(5, 10), 9); // Math.floor(5 + 0.999 * 5) = Math.floor(9.995) = 9
    randomMock3.mock.restore();
  });

  await t.test('randomBool', () => {
    const randomMock = mock.method(Math, 'random', () => 0.49);
    assert.equal(randomUtils.randomBool(), false);
    randomMock.mock.restore();

    const randomMock2 = mock.method(Math, 'random', () => 0.51);
    assert.equal(randomUtils.randomBool(), true);
    randomMock2.mock.restore();
  });

  await t.test('generateConfettiParticle', () => {
    const randomMock = mock.method(Math, 'random', () => 0.5); // Fixed random
    const particle = randomUtils.generateConfettiParticle(1, ['red', 'blue', 'green']);
    assert.deepEqual(particle, {
      id: 1,
      x: 50, // 0.5 * 100
      color: 'blue', // ['red', 'blue', 'green'][Math.floor(0.5 * 3)] = [1] = 'blue'
      delay: 0.25, // 0.5 * 0.5
      rotation: 180, // 0.5 * 360
      scale: 0.75, // 0.5 + 0.5 * 0.5
      isRounded: false // 0.5 > 0.5 -> false
    });
    randomMock.mock.restore();
  });

  await t.test('generateCursorStar', () => {
    const randomMock = mock.method(Math, 'random', () => 0.5);
    const star = randomUtils.generateCursorStar(100, 200, 1);
    assert.deepEqual(star, {
      id: 1,
      x: 100,
      y: 200,
      opacity: 1,
      scale: 1 // 0.5 + 0.5
    });
    randomMock.mock.restore();
  });

  await t.test('generateFoodSpawn', () => {
    // Math.random for: x (0.5), speed (0.5), fruit (0.5)
    const randomMock = mock.method(Math, 'random', () => 0.5);
    const cryptoMock = mock.method(global.crypto, 'randomUUID', () => 'mock-uuid');

    const spawn = randomUtils.generateFoodSpawn(100, 10, ['apple', 'banana', 'cherry', 'date'], 4);
    assert.deepEqual(spawn, {
      id: 'mock-uuid',
      x: 45, // 0.5 * (100 - 10)
      y: -10,
      speed: 3, // 2 + 0.5 * 2
      fruit: 'cherry' // ['apple', 'banana', 'cherry', 'date'][Math.floor(0.5 * 4)] = [2] = 'cherry'
    });

    randomMock.mock.restore();
    cryptoMock.mock.restore();
  });
});
