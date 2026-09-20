import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  concurrentMap,
  throttle,
  debounce,
  scheduleIdleWork,
} from "./concurrency.ts";

describe("concurrency utilities", () => {
  describe("concurrentMap", () => {
    it("returns empty array when given empty input array", async () => {
      const result = await concurrentMap([], 2, async (x) => x);
      assert.deepEqual(result, []);
    });

    it("handles concurrency greater than item length", async () => {
      const items = [1, 2];
      const result = await concurrentMap(items, 10, async (x) => x * 10);
      assert.deepEqual(result, [10, 20]);
    });

    it("enforces max concurrency limit while preserving result order", async () => {
      const items = [100, 50, 10, 80, 20];
      let activeCount = 0;
      let maxActiveObserved = 0;

      const result = await concurrentMap(items, 2, async (delayMs) => {
        activeCount++;
        if (activeCount > maxActiveObserved) {
          maxActiveObserved = activeCount;
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        activeCount--;
        return delayMs * 2;
      });

      assert.equal(maxActiveObserved, 2);
      assert.deepEqual(result, [200, 100, 20, 160, 40]);
    });

    it("works with concurrency equal to 1 (strictly sequential execution)", async () => {
      const items = [1, 2, 3];
      const executionLog: number[] = [];

      const result = await concurrentMap(items, 1, async (item) => {
        executionLog.push(item);
        return item * 2;
      });

      assert.deepEqual(executionLog, [1, 2, 3]);
      assert.deepEqual(result, [2, 4, 6]);
    });

    it("propagates errors when a worker function throws", async () => {
      const items = [1, 2, 3, 4];
      await assert.rejects(
        async () => {
          await concurrentMap(items, 2, async (item) => {
            if (item === 3) {
              throw new Error("Worker failed at item 3");
            }
            return item;
          });
        },
        {
          name: "Error",
          message: "Worker failed at item 3",
        },
      );
    });

    it("prevents subsequent tasks from executing after an error occurs", async () => {
      const executed: number[] = [];
      const items = [1, 2, 3, 4, 5, 6];

      await assert.rejects(
        async () => {
          await concurrentMap(items, 1, async (item) => {
            executed.push(item);
            if (item === 2) {
              throw new Error("Failure at item 2");
            }
            return item;
          });
        },
        {
          name: "Error",
          message: "Failure at item 2",
        },
      );

      assert.deepEqual(executed, [1, 2]);
    });
  });

  describe("throttle", () => {
    it("executes immediately on first call and throttles subsequent calls within limit window", (t) => {
      t.mock.timers.enable({ apis: ["setTimeout"] });
      let calls = 0;
      const fn = throttle(() => {
        calls++;
      }, 100);

      fn();
      fn();
      fn();

      assert.equal(calls, 1);

      t.mock.timers.tick(100);

      fn();
      assert.equal(calls, 2);
    });

    it("allows new execution after throttle period elapses across multiple cycles", (t) => {
      t.mock.timers.enable({ apis: ["setTimeout"] });
      let calls = 0;
      const fn = throttle(() => {
        calls++;
      }, 100);

      fn(); // Call 1 (executes)
      fn(); // Throttled
      assert.equal(calls, 1);

      t.mock.timers.tick(100);
      fn(); // Call 2 (executes)
      assert.equal(calls, 2);

      t.mock.timers.tick(50);
      fn(); // Throttled
      assert.equal(calls, 2);

      t.mock.timers.tick(50);
      fn(); // Call 3 (executes)
      assert.equal(calls, 3);
    });

    it("passes arguments correctly to throttled function", () => {
      const argsReceived: [number, string][] = [];
      const fn = throttle((num: number, str: string) => {
        argsReceived.push([num, str]);
      }, 100);

      fn(42, "hello");
      assert.deepEqual(argsReceived, [[42, "hello"]]);
    });
  });

  describe("debounce", () => {
    it("delays execution until wait time elapses without new calls", (t) => {
      t.mock.timers.enable({ apis: ["setTimeout"] });
      let calls = 0;
      const fn = debounce(() => {
        calls++;
      }, 100);

      fn();
      assert.equal(calls, 0);

      t.mock.timers.tick(50);
      assert.equal(calls, 0);

      t.mock.timers.tick(50);
      assert.equal(calls, 1);
    });

    it("resets wait timer on repeated calls and uses arguments from latest call", (t) => {
      t.mock.timers.enable({ apis: ["setTimeout"] });
      let lastCallArg = "";
      const fn = debounce((arg: string) => {
        lastCallArg = arg;
      }, 100);

      fn("first");
      t.mock.timers.tick(50);

      fn("second"); // reset timer
      t.mock.timers.tick(50);
      assert.equal(lastCallArg, "");

      t.mock.timers.tick(50);
      assert.equal(lastCallArg, "second");
    });

    it("executes immediately on leading edge when immediate is true", (t) => {
      t.mock.timers.enable({ apis: ["setTimeout"] });
      let calls = 0;
      const fn = debounce(
        () => {
          calls++;
        },
        100,
        true,
      );

      fn(); // immediate execution
      assert.equal(calls, 1);

      fn(); // ignored during wait
      assert.equal(calls, 1);

      t.mock.timers.tick(100);
      assert.equal(calls, 1);

      fn(); // execution allowed again
      assert.equal(calls, 2);
    });

    it("defaults immediate parameter to false when omitted", (t) => {
      t.mock.timers.enable({ apis: ["setTimeout"] });
      let calls = 0;
      const fn = debounce(() => {
        calls++;
      }, 100);

      fn();
      assert.equal(calls, 0); // Not immediate

      t.mock.timers.tick(100);
      assert.equal(calls, 1);
    });

    it("passes arguments and context (this) to debounced function", (t) => {
      t.mock.timers.enable({ apis: ["setTimeout"] });
      let lastArgs: [number, string] | null = null;
      let lastContext: unknown = null;

      const obj = {
        method: debounce(function (this: unknown, a: number, b: string) {
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          lastContext = this;
          lastArgs = [a, b];
        }, 100),
      };

      obj.method(10, "test");
      t.mock.timers.tick(100);

      assert.equal(lastContext, obj);
      assert.deepEqual(lastArgs, [10, "test"]);
    });
  });

  describe("scheduleIdleWork", () => {
    it("schedules via window.requestIdleCallback with default timeout parameter", () => {
      let optionsPassed: { timeout?: number } | undefined;

      const origWindow = globalThis.window;
      // @ts-expect-error mocking window for test
      globalThis.window = {
        requestIdleCallback: (_cb: () => void, opts?: { timeout?: number }) => {
          optionsPassed = opts;
          return 123;
        },
        cancelIdleCallback: () => {},
      };

      try {
        scheduleIdleWork(() => {});
        assert.deepEqual(optionsPassed, { timeout: 2000 });
      } finally {
        globalThis.window = origWindow;
      }
    });

    it("schedules via window.requestIdleCallback when available and cancels correctly", () => {
      let callbackInvoked = false;
      let cancelCalledWith: number | null = null;
      let optionsPassed: { timeout?: number } | undefined;

      const origWindow = globalThis.window;
      // @ts-expect-error mocking window for test
      globalThis.window = {
        requestIdleCallback: (cb: () => void, opts?: { timeout?: number }) => {
          optionsPassed = opts;
          cb();
          return 123;
        },
        cancelIdleCallback: (id: number) => {
          cancelCalledWith = id;
        },
      };

      try {
        const cancel = scheduleIdleWork(() => {
          callbackInvoked = true;
        }, 1000);

        assert.equal(callbackInvoked, true);
        assert.deepEqual(optionsPassed, { timeout: 1000 });
        cancel();
        assert.equal(cancelCalledWith, 123);
      } finally {
        globalThis.window = origWindow;
      }
    });

    it("falls back to setTimeout when requestIdleCallback is absent", (t) => {
      t.mock.timers.enable({ apis: ["setTimeout"] });
      let workDone = false;

      const origWindow = globalThis.window;
      // @ts-expect-error mocking window without requestIdleCallback
      globalThis.window = {};

      try {
        const cancel = scheduleIdleWork(() => {
          workDone = true;
        }, 2000);

        assert.equal(workDone, false);
        t.mock.timers.tick(400); // Math.min(2000, 400)
        assert.equal(workDone, true);

        cancel();
      } finally {
        globalThis.window = origWindow;
      }
    });

    it("caps setTimeout delay to 400ms when requestIdleCallback is absent", (t) => {
      t.mock.timers.enable({ apis: ["setTimeout"] });
      let workDone = false;

      const origWindow = globalThis.window;
      // @ts-expect-error mocking window without requestIdleCallback
      globalThis.window = {};

      try {
        scheduleIdleWork(() => {
          workDone = true;
        }, 5000);

        assert.equal(workDone, false);
        t.mock.timers.tick(399);
        assert.equal(workDone, false);
        t.mock.timers.tick(1);
        assert.equal(workDone, true);
      } finally {
        globalThis.window = origWindow;
      }
    });

    it("cancels fallback setTimeout before execution", (t) => {
      t.mock.timers.enable({ apis: ["setTimeout"] });
      let workDone = false;

      const origWindow = globalThis.window;
      // @ts-expect-error mocking window without requestIdleCallback
      globalThis.window = {};

      try {
        const cancel = scheduleIdleWork(() => {
          workDone = true;
        }, 1000);

        cancel();
        t.mock.timers.tick(400);
        assert.equal(workDone, false);
      } finally {
        globalThis.window = origWindow;
      }
    });

    it("returns no-op function when window is undefined in SSR", () => {
      const origWindow = globalThis.window;
      // @ts-expect-error simulating SSR
      delete globalThis.window;

      try {
        const cancel = scheduleIdleWork(() => {});
        assert.equal(typeof cancel, "function");
        assert.equal(cancel(), undefined);
      } finally {
        globalThis.window = origWindow;
      }
    });
  });
});
