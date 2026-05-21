import assert from "node:assert/strict";
import test from "node:test";

import { writeStoredJson } from "./analyticsService.ts";

const originalConsoleWarn = console.warn;
const globalWithWindow = globalThis as typeof globalThis & { window?: unknown };
const originalWindow = globalWithWindow.window;

const resetWindow = () => {
  if (originalWindow === undefined) {
    Reflect.deleteProperty(globalWithWindow, "window");
    return;
  }
  globalWithWindow.window = originalWindow;
};

test.afterEach(() => {
  console.warn = originalConsoleWarn;
  resetWindow();
});

test("writeStoredJson logs warning if localStorage.setItem throws", (t) => {
  // Mock console.warn
  const warnCalls: any[][] = [];
  console.warn = (...args: any[]) => {
    warnCalls.push(args);
  };

  // Mock window.localStorage.setItem to throw an error
  const mockError = new Error("QuotaExceededError");
  globalWithWindow.window = {
    localStorage: {
      setItem: () => {
        throw mockError;
      },
    },
  } as unknown as Window & typeof globalThis;

  const cloneFn = (v: any) => v;
  const result = writeStoredJson({
    storageKey: "test-key",
    value: { data: 123 },
    clone: cloneFn,
    label: "test data",
  });

  assert.deepEqual(result, { data: 123 });
  assert.equal(warnCalls.length, 1);
  assert.equal(warnCalls[0][0], "Failed to persist test data.");
  assert.equal(warnCalls[0][1], mockError);
});

test("writeStoredJson handles undefined window without throwing", () => {
  // Ensure window is undefined
  resetWindow();

  const warnCalls: any[][] = [];
  console.warn = (...args: any[]) => {
    warnCalls.push(args);
  };

  const cloneFn = (v: any) => v;
  const result = writeStoredJson({
    storageKey: "test-key",
    value: { data: 456 },
    clone: cloneFn,
    label: "test data",
  });

  assert.deepEqual(result, { data: 456 });
  assert.equal(warnCalls.length, 0); // Should not warn since it just skips
});
