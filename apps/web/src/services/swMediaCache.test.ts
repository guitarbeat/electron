import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { warmServiceWorkerMedia } from "./swMediaCache.js";

describe("swMediaCache", () => {
  let originalWindow: any;
  let originalNavigator: any;

  beforeEach(() => {
    originalWindow = globalThis.window;
    originalNavigator = globalThis.navigator;
    // Set up mock window object so typeof window !== "undefined" passes
    (globalThis as any).window = globalThis;
  });

  afterEach(() => {
    (globalThis as any).window = originalWindow;
    Object.defineProperty(globalThis, "navigator", {
      value: originalNavigator,
      configurable: true,
      writable: true,
    });
  });

  it("does nothing if navigator or serviceWorker is undefined", () => {
    Object.defineProperty(globalThis, "navigator", {
      value: {},
      configurable: true,
      writable: true,
    });

    assert.doesNotThrow(() => {
      warmServiceWorkerMedia(["https://example.com/poster.jpg"]);
    });
  });

  it("filters out invalid, empty, or API URLs", () => {
    let postMessageCalled = false;
    let postedData: any = null;

    Object.defineProperty(globalThis, "navigator", {
      value: {
        serviceWorker: {
          controller: {
            postMessage: (data: any) => {
              postMessageCalled = true;
              postedData = data;
            },
          },
        },
      },
      configurable: true,
      writable: true,
    });

    warmServiceWorkerMedia([
      "https://example.com/poster1.jpg",
      "http://example.com/poster2.jpg",
      "/local-image.png",
      "/api/movies", // Should be filtered out
      "",
      null,
      undefined,
      "invalid-protocol://test",
    ]);

    assert.equal(postMessageCalled, true);
    assert.deepEqual(postedData, {
      type: "CACHE_URLS",
      urls: [
        "https://example.com/poster1.jpg",
        "http://example.com/poster2.jpg",
        "/local-image.png",
      ],
    });
  });

  it("registers listener on serviceWorker.ready if controller is not present", async () => {
    let postMessageCalled = false;
    let postedData: any = null;

    let readyResolver: (val: any) => void;
    const readyPromise = new Promise((resolve) => {
      readyResolver = resolve;
    });

    Object.defineProperty(globalThis, "navigator", {
      value: {
        serviceWorker: {
          controller: null,
          ready: readyPromise,
        },
      },
      configurable: true,
      writable: true,
    });

    warmServiceWorkerMedia(["https://example.com/poster.jpg"]);

    // Resolve serviceWorker.ready
    readyResolver!({
      active: {
        postMessage: (data: any) => {
          postMessageCalled = true;
          postedData = data;
        },
      },
    });

    await readyPromise;
    // Allow microtask ticks for .then handler
    await new Promise((r) => setTimeout(r, 10));

    assert.equal(postMessageCalled, true);
    assert.deepEqual(postedData, {
      type: "CACHE_URLS",
      urls: ["https://example.com/poster.jpg"],
    });
  });
});
