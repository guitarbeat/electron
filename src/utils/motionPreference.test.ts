import assert from "node:assert/strict";
import test from "node:test";
import {
  hasFinePointer,
  hasHoverCapability,
  isChromaSpotlightEnabled,
  prefersReducedMotion,
  subscribeMotionPreferences,
} from "./motionPreference.ts";

const installWindowMocks = (mediaQueries: Record<string, boolean> = {}) => {
  const listeners = new Map<string, Set<() => void>>();

  const matchMedia = ((query: string) => ({
    matches: mediaQueries[query] || false,
    media: query,
    onchange: null,
    addEventListener: (event: string, callback: () => void) => {
      if (event === "change") {
        if (!listeners.has(query)) {
          listeners.set(query, new Set());
        }
        listeners.get(query)!.add(callback);
      }
    },
    removeEventListener: (event: string, callback: () => void) => {
      if (event === "change") {
        listeners.get(query)?.delete(callback);
      }
    },
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;

  const originalWindow = globalThis.window;
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      matchMedia,
    },
  });

  return {
    restore: () => {
      if (originalWindow === undefined) {
        // @ts-expect-error - deleting global property
        delete globalThis.window;
      } else {
        Object.defineProperty(globalThis, "window", {
          configurable: true,
          value: originalWindow,
        });
      }
    },
    getListeners: (query: string) => listeners.get(query) || new Set(),
  };
};

test("prefersReducedMotion", async (t) => {
  await t.test("returns true when matches", () => {
    const { restore } = installWindowMocks({ "(prefers-reduced-motion: reduce)": true });
    try {
      assert.equal(prefersReducedMotion(), true);
    } finally {
      restore();
    }
  });

  await t.test("returns false when does not match", () => {
    const { restore } = installWindowMocks({ "(prefers-reduced-motion: reduce)": false });
    try {
      assert.equal(prefersReducedMotion(), false);
    } finally {
      restore();
    }
  });

  await t.test("returns false in SSR", () => {
    const { restore } = installWindowMocks();
    restore(); // Ensure window is undefined
    assert.equal(typeof window, "undefined");
    assert.equal(prefersReducedMotion(), false);
  });
});

test("hasHoverCapability", async (t) => {
  await t.test("returns true when matches", () => {
    const { restore } = installWindowMocks({ "(hover: hover)": true });
    try {
      assert.equal(hasHoverCapability(), true);
    } finally {
      restore();
    }
  });

  await t.test("returns false when does not match", () => {
    const { restore } = installWindowMocks({ "(hover: hover)": false });
    try {
      assert.equal(hasHoverCapability(), false);
    } finally {
      restore();
    }
  });

  await t.test("returns false in SSR", () => {
    const { restore } = installWindowMocks();
    restore(); // Ensure window is undefined
    assert.equal(hasHoverCapability(), false);
  });
});

test("hasFinePointer", async (t) => {
  await t.test("returns true when matches", () => {
    const { restore } = installWindowMocks({ "(pointer: fine)": true });
    try {
      assert.equal(hasFinePointer(), true);
    } finally {
      restore();
    }
  });

  await t.test("returns false when does not match", () => {
    const { restore } = installWindowMocks({ "(pointer: fine)": false });
    try {
      assert.equal(hasFinePointer(), false);
    } finally {
      restore();
    }
  });

  await t.test("returns false in SSR", () => {
    const { restore } = installWindowMocks();
    restore(); // Ensure window is undefined
    assert.equal(hasFinePointer(), false);
  });
});

test("isChromaSpotlightEnabled", async (t) => {
  await t.test("returns true when hover and fine pointer, and no reduced motion", () => {
    const { restore } = installWindowMocks({
      "(prefers-reduced-motion: reduce)": false,
      "(hover: hover)": true,
      "(pointer: fine)": true,
    });
    try {
      assert.equal(isChromaSpotlightEnabled(), true);
    } finally {
      restore();
    }
  });

  await t.test("returns false when prefers reduced motion", () => {
    const { restore } = installWindowMocks({
      "(prefers-reduced-motion: reduce)": true,
      "(hover: hover)": true,
      "(pointer: fine)": true,
    });
    try {
      assert.equal(isChromaSpotlightEnabled(), false);
    } finally {
      restore();
    }
  });

  await t.test("returns false when no hover capability", () => {
    const { restore } = installWindowMocks({
      "(prefers-reduced-motion: reduce)": false,
      "(hover: hover)": false,
      "(pointer: fine)": true,
    });
    try {
      assert.equal(isChromaSpotlightEnabled(), false);
    } finally {
      restore();
    }
  });

  await t.test("returns false when no fine pointer", () => {
    const { restore } = installWindowMocks({
      "(prefers-reduced-motion: reduce)": false,
      "(hover: hover)": true,
      "(pointer: fine)": false,
    });
    try {
      assert.equal(isChromaSpotlightEnabled(), false);
    } finally {
      restore();
    }
  });
});

test("subscribeMotionPreferences", async (t) => {
  await t.test("adds and removes event listeners", () => {
    const { restore, getListeners } = installWindowMocks();
    try {
      const onChange = () => {};

      const unsubscribe = subscribeMotionPreferences(onChange);

      const motionListeners = getListeners("(prefers-reduced-motion: reduce)");
      const hoverListeners = getListeners("(hover: hover)");

      assert.equal(motionListeners.has(onChange), true);
      assert.equal(hoverListeners.has(onChange), true);

      unsubscribe();

      assert.equal(motionListeners.has(onChange), false);
      assert.equal(hoverListeners.has(onChange), false);
    } finally {
      restore();
    }
  });

  await t.test("returns a no-op function in SSR", () => {
    const { restore } = installWindowMocks();
    restore(); // Ensure window is undefined

    const unsubscribe = subscribeMotionPreferences(() => {});

    // Should not throw, and should be callable without error
    unsubscribe();
  });
});
