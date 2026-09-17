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

    it("resets wait timer on repeated calls", (t) => {
      t.mock.timers.enable({ apis: ["setTimeout"] });
      let calls = 0;
      const fn = debounce(() => {
        calls++;
      }, 100);

      fn();
      t.mock.timers.tick(50);

      fn(); // reset timer
      t.mock.timers.tick(50);
      assert.equal(calls, 0);

      t.mock.timers.tick(50);
      assert.equal(calls, 1);
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
  });

  describe("scheduleIdleWork", () => {
    it("schedules via window.requestIdleCallback when available and cancels correctly", () => {
      let callbackInvoked = false;
      let cancelCalledWith: number | null = null;

      const origWindow = globalThis.window;
      // @ts-expect-error mocking window for test
      globalThis.window = {
        requestIdleCallback: (cb: () => void) => {
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
