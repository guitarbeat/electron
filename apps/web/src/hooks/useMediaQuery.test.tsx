import assert from "node:assert/strict";
import test from "node:test";
import { renderHook, act } from "@testing-library/react";
import { JSDOM } from "jsdom";
import { useMediaQuery, mediaBreakpoints } from "./useMediaQuery.ts";

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost'
});
globalThis.window = dom.window as unknown as Window & typeof globalThis;
globalThis.document = dom.window.document as unknown as Document;

test("mediaBreakpoints provides standard breakpoints", () => {
  assert.equal(mediaBreakpoints.sm, "(max-width: 640px)");
  assert.equal(mediaBreakpoints.md, "(max-width: 768px)");
  assert.equal(mediaBreakpoints.lg, "(max-width: 1024px)");
  assert.equal(mediaBreakpoints.xl, "(max-width: 1280px)");
});

test("useMediaQuery returns true when media query matches", () => {
  let addEventListenerCalled = false;
  let removeEventListenerCalled = false;

  const originalMatchMedia = globalThis.window.matchMedia;
  globalThis.window.matchMedia = ((query: string) => {
    return {
      matches: query === "(max-width: 640px)",
      addEventListener: () => {
        addEventListenerCalled = true;
      },
      removeEventListener: () => {
        removeEventListenerCalled = true;
      },
    } as unknown as MediaQueryList;
  }) as typeof window.matchMedia;

  try {
    const { result, unmount } = renderHook(() => useMediaQuery("(max-width: 640px)"));
    assert.equal(result.current, true);
    assert.equal(addEventListenerCalled, true);

    unmount();
    assert.equal(removeEventListenerCalled, true);
  } finally {
    globalThis.window.matchMedia = originalMatchMedia;
  }
});

test("useMediaQuery returns false when media query does not match", () => {
  const originalMatchMedia = globalThis.window.matchMedia;
  globalThis.window.matchMedia = ((query: string) => {
    return {
      matches: query === "(max-width: 1024px)",
      addEventListener: () => {},
      removeEventListener: () => {},
    } as unknown as MediaQueryList;
  }) as typeof window.matchMedia;

  try {
    const { result } = renderHook(() => useMediaQuery("(max-width: 640px)"));
    assert.equal(result.current, false);
  } finally {
    globalThis.window.matchMedia = originalMatchMedia;
  }
});

test("useMediaQuery updates when media query matches change", () => {
  let listener: (() => void) | null = null;
  let matches = false;

  const originalMatchMedia = globalThis.window.matchMedia;
  globalThis.window.matchMedia = ((query: string) => {
    return {
      get matches() { return matches; },
      addEventListener: (event: string, callback: () => void) => {
        if (event === "change") listener = callback;
      },
      removeEventListener: () => {
        listener = null;
      },
    } as unknown as MediaQueryList;
  }) as typeof window.matchMedia;

  try {
    const { result } = renderHook(() => useMediaQuery("(max-width: 640px)"));

    // Initially false
    assert.equal(result.current, false);

    // Trigger a change
    act(() => {
      matches = true;
      if (listener) listener();
    });

    // Should now be true
    assert.equal(result.current, true);
  } finally {
    globalThis.window.matchMedia = originalMatchMedia;
  }
});
