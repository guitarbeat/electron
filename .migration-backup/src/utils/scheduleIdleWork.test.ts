import assert from "node:assert/strict";
import test from "node:test";
import { scheduleIdleWork } from "./scheduleIdleWork.ts";

test("scheduleIdleWork", async (t) => {
  const originalWindow = (global as unknown as { window: unknown }).window;
  const originalSetTimeout = globalThis.setTimeout;
  const originalClearTimeout = globalThis.clearTimeout;

  t.afterEach(() => {
    (global as unknown as { window: unknown }).window = originalWindow;
    globalThis.setTimeout = originalSetTimeout;
    globalThis.clearTimeout = originalClearTimeout;
  });

  await t.test("returns no-op when window is undefined", () => {
    delete (global as unknown as { window?: unknown }).window;

    let workCalled = false;
    const work = () => { workCalled = true; };

    const cancel = scheduleIdleWork(work);

    assert.equal(typeof cancel, "function");
    assert.equal(cancel(), undefined);
    assert.equal(workCalled, false);
  });

  await t.test("uses requestIdleCallback when available", () => {
    let ricCalled = false;
    let cicCalled = false;
    let workFn: (() => void) | undefined;
    let ricOptions: { timeout?: number } | undefined;
    let cicId: number | undefined;

    (global as unknown as { window: unknown }).window = {
      requestIdleCallback: (fn: () => void, options: { timeout?: number }) => {
        ricCalled = true;
        workFn = fn;
        ricOptions = options;
        return 123;
      },
      cancelIdleCallback: (id: number) => {
        cicCalled = true;
        cicId = id;
      }
    };

    let workCalled = false;
    const work = () => { workCalled = true; };

    const cancel = scheduleIdleWork(work, 1500);

    assert.equal(ricCalled, true);
    assert.equal(ricOptions?.timeout, 1500);
    assert.equal(typeof workFn, "function");

    if (workFn) workFn();
    assert.equal(workCalled, true);

    cancel();
    assert.equal(cicCalled, true);
    assert.equal(cicId, 123);
  });

  await t.test("falls back to setTimeout when requestIdleCallback is not available", () => {
    (global as unknown as { window: unknown }).window = {};

    let stCalled = false;
    let ctCalled = false;
    let workFn: (() => void) | undefined;
    let stTimeout: number | undefined;
    let ctId: ReturnType<typeof setTimeout> | undefined;

    globalThis.setTimeout = ((fn: () => void, timeout: number) => {
      stCalled = true;
      workFn = fn;
      stTimeout = timeout;
      return 456 as unknown as ReturnType<typeof setTimeout>;
    }) as unknown as typeof setTimeout;

    globalThis.clearTimeout = ((id: ReturnType<typeof setTimeout>) => {
      ctCalled = true;
      ctId = id;
    }) as unknown as typeof clearTimeout;

    let workCalled = false;
    const work = () => { workCalled = true; };

    const cancel = scheduleIdleWork(work, 1500);

    assert.equal(stCalled, true);
    assert.equal(stTimeout, 400);

    if (workFn) workFn();
    assert.equal(workCalled, true);

    cancel();
    assert.equal(ctCalled, true);
    assert.equal(ctId, 456);
  });

  await t.test("uses requested timeout if smaller than 400ms for setTimeout fallback", () => {
    (global as unknown as { window: unknown }).window = {};

    let stTimeout: number | undefined;
    globalThis.setTimeout = ((fn: () => void, timeout: number) => {
      stTimeout = timeout;
      return 456 as unknown as ReturnType<typeof setTimeout>;
    }) as unknown as typeof setTimeout;
    globalThis.clearTimeout = () => {};

    const work = () => {};

    scheduleIdleWork(work, 200);

    assert.equal(stTimeout, 200);
  });
});
