import test from "node:test";
import assert from "node:assert/strict";
import {
  readMovieBrowseLayout,
  writeMovieBrowseLayout,
} from "./movieBrowseLayout.ts";

test("movie browse layout persists to localStorage", () => {
  const storage = new Map<string, string>();
  const originalWindow = globalThis.window;

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
      },
    },
  });

  try {
    assert.equal(readMovieBrowseLayout(), "grid");

    writeMovieBrowseLayout("scroll");
    assert.equal(readMovieBrowseLayout(), "scroll");

    writeMovieBrowseLayout("grid");
    assert.equal(readMovieBrowseLayout(), "grid");
  } finally {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  }
});
