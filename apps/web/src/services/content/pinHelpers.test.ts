import test from "node:test";
import assert from "node:assert/strict";
import {
  clonePins,
  normalizeUserPins,
  isUserPinsRecord,
  parsePinsContent,
  createSerialTaskRunner,
} from "./index.ts";

test("clonePins", async (t) => {
  await t.test("returns a new object with the same properties", () => {
    const original = { Aaron: "hash1", Electra: "hash2" };
    const cloned = clonePins(original);

    assert.deepEqual(cloned, original);
    assert.notEqual(cloned, original); // Ensure it's a new reference
  });

  await t.test("handles empty object", () => {
    const original = {};
    const cloned = clonePins(original);

    assert.deepEqual(cloned, original);
    assert.notEqual(cloned, original);
  });
});

test("normalizeUserPins", async (t) => {
  await t.test("returns null for non-objects", () => {
    assert.equal(normalizeUserPins(null), null);
    assert.equal(normalizeUserPins(undefined), null);
    assert.equal(normalizeUserPins("string"), null);
    assert.equal(normalizeUserPins(123), null);
    assert.equal(normalizeUserPins(true), null);
  });

  await t.test("normalizes valid properties, keeping them if valid", () => {
    const input = { Aaron: " hash1 ", Electra: "hash2" };
    const expected = { Aaron: "hash1", Electra: "hash2" };
    assert.deepEqual(normalizeUserPins(input), expected);
  });

  await t.test("filters out non-string or empty string values", () => {
    const input = { Aaron: 123, Electra: "   " };
    const expected = { Aaron: undefined, Electra: undefined };
    assert.deepEqual(normalizeUserPins(input), expected);
  });

  await t.test("handles missing properties correctly", () => {
    const input = { Aaron: "hash1" };
    const expected = { Aaron: "hash1", Electra: undefined };
    assert.deepEqual(normalizeUserPins(input), expected);
  });

  await t.test("ignores unknown properties", () => {
    const input = { Aaron: "hash1", Unknown: "hash3" };
    const expected = { Aaron: "hash1", Electra: undefined };
    assert.deepEqual(normalizeUserPins(input), expected);
  });
});

test("isUserPinsRecord", async (t) => {
  await t.test("returns true for valid objects", () => {
    assert.equal(isUserPinsRecord({ Aaron: "hash1" }), true);
    assert.equal(isUserPinsRecord({}), true);
  });

  await t.test("returns false for invalid inputs", () => {
    assert.equal(isUserPinsRecord(null), false);
    assert.equal(isUserPinsRecord("string"), false);
    assert.equal(isUserPinsRecord(123), false);
  });
});

test("parsePinsContent", async (t) => {
  await t.test("returns empty object for undefined/empty string", () => {
    assert.deepEqual(parsePinsContent(undefined), {});
    assert.deepEqual(parsePinsContent(""), {});
  });

  await t.test("parses valid JSON and normalizes", () => {
    const jsonStr = JSON.stringify({ Aaron: " hash1 ", Electra: "hash2" });
    const expected = { Aaron: "hash1", Electra: "hash2" };
    assert.deepEqual(parsePinsContent(jsonStr), expected);
  });

  await t.test("normalizes valid JSON arrays into empty user pin slots", () => {
    const jsonStr = JSON.stringify(["Aaron", "hash1"]);
    assert.deepEqual(parsePinsContent(jsonStr), {
      Aaron: undefined,
      Electra: undefined,
    });
  });

  await t.test("handles invalid JSON gracefully", () => {
    // Suppress console.error during test
    const originalConsoleError = console.error;
    let errorLogged = false;
    console.error = () => {
      errorLogged = true;
    };

    try {
      assert.deepEqual(parsePinsContent("invalid json"), {});
      assert.equal(errorLogged, true);
    } finally {
      console.error = originalConsoleError;
    }
  });

  await t.test(
    "handles valid JSON that normalizes to null (e.g., null string)",
    () => {
      const jsonStr = JSON.stringify(null);
      assert.deepEqual(parsePinsContent(jsonStr), {});
    },
  );
});

test("createSerialTaskRunner", async (t) => {
  await t.test("executes asynchronous tasks sequentially", async () => {
    const runner = createSerialTaskRunner();
    const results: number[] = [];

    const task1 = () =>
      new Promise<number>((resolve) =>
        setTimeout(() => {
          results.push(1);
          resolve(1);
        }, 10),
      );
    const task2 = () =>
      new Promise<number>((resolve) => {
        results.push(2);
        resolve(2);
      });

    const p1 = runner(task1);
    const p2 = runner(task2);

    assert.deepEqual(results, []); // Nothing finished yet

    await Promise.all([p1, p2]);
    assert.deepEqual(results, [1, 2]); // Executed in order
  });

  await t.test("properly passes return values", async () => {
    const runner = createSerialTaskRunner();
    const val1 = await runner(async () => "first");
    const val2 = await runner(async () => "second");

    assert.equal(val1, "first");
    assert.equal(val2, "second");
  });

  await t.test(
    "handles rejected promises without breaking the chain",
    async () => {
      const runner = createSerialTaskRunner();

      const task1 = async () => {
        throw new Error("Task 1 failed");
      };
      const task2 = async () => "Task 2 success";

      await assert.rejects(runner(task1), /Task 1 failed/);
      const result2 = await runner(task2);

      assert.equal(result2, "Task 2 success");
    },
  );
});
