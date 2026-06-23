import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import * as ReactDOMServer from "react-dom/server";

import { useMediaQuery } from "./useMediaQuery.ts";

test("useMediaQuery", async (t) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const originalWindow = (global as any).window;

  t.afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).window = originalWindow;
  });

  await t.test("getServerSnapshot returns false (default server render behavior)", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).window = {
      matchMedia: (query: string) => ({
        matches: query === "(min-width: 500px)",
        addEventListener: () => {},
        removeEventListener: () => {},
      }),
    };

    function TestComponent() {
      const matches = useMediaQuery("(min-width: 500px)");
      return React.createElement("div", null, String(matches));
    }

    const html = ReactDOMServer.renderToString(React.createElement(TestComponent));

    // During server render, useSyncExternalStore calls getServerSnapshot, which returns false
    assert.equal(html.includes("false"), true);
  });

  await t.test("subscribe attaches change event listener to window.matchMedia", () => {
    let mockCallback: (() => void) | undefined;
    let addedEvent: string | undefined;
    let removedEvent: string | undefined;
    let requestedQuery: string | undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).window = {
      matchMedia: (query: string) => {
        requestedQuery = query;
        return {
          matches: query === "(min-width: 500px)",
          addEventListener: (event: string, callback: () => void) => {
            addedEvent = event;
            mockCallback = callback;
          },
          removeEventListener: (event: string) => {
            removedEvent = event;
          },
        };
      }
    };

    let capturedSubscribe: ((callback: () => void) => () => void) | undefined;
    let capturedGetSnapshot: (() => boolean) | undefined;

    // React 19 exposes dispatcher as React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE.H
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const internals = (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
    const originalDispatcher = internals.H;

    internals.H = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      useCallback: (cb: any) => cb,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      useSyncExternalStore: (subscribe: any, getSnapshot: any) => {
        capturedSubscribe = subscribe;
        capturedGetSnapshot = getSnapshot;
        return getSnapshot();
      }
    };

    try {
      useMediaQuery("(min-width: 500px)");
    } finally {
      internals.H = originalDispatcher;
    }

    assert.ok(capturedSubscribe, "subscribe should be captured");
    assert.ok(capturedGetSnapshot, "getSnapshot should be captured");

    // Test getSnapshot logic
    assert.equal(capturedGetSnapshot!(), true);
    assert.equal(requestedQuery, "(min-width: 500px)");

    // Test subscribe logic
    const dummyCallback = () => {};
    const unsubscribe = capturedSubscribe!(dummyCallback);

    assert.equal(addedEvent, "change");
    assert.equal(mockCallback, dummyCallback);

    // Test unsubscribe logic
    unsubscribe();
    assert.equal(removedEvent, "change");
  });
});
