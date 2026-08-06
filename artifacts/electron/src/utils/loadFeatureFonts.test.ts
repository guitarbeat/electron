import test from "node:test";
import assert from "node:assert";

// Mock implementation of a simple DOM element for our tests
class MockElement {
  dataset: Record<string, string> = {};
  rel: string = "";
  href: string = "";
  sheet?: Record<string, unknown>;

  private listeners: Record<string, Array<() => void>> = {};

  addEventListener(event: string, callback: () => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  // Helper for tests to trigger events
  triggerEvent(event: string) {
    const eventListeners = this.listeners[event] || [];
    for (const listener of eventListeners) {
      listener();
    }
  }
}

// Utility to get a fresh module instance for each test so module state (the promise cache) is cleared.
async function getFreshModule(id: string) {
  return await import(`./loadFeatureFonts.ts?time=${Date.now()}_${id}`);
}

test("loadFeatureFonts", async (t) => {
  t.afterEach(() => {
    // Clean up the global object
    delete (global as any).document;
  });

  await t.test("resolves immediately when document is undefined (SSR)", async () => {
    // Ensure document is not defined
    delete (global as any).document;
    const { loadFeatureFonts } = await getFreshModule('ssr');

    await assert.doesNotReject(loadFeatureFonts());
  });

  await t.test("resolves immediately if link already exists and has a sheet", async () => {
    const existingElement = new MockElement();
    existingElement.sheet = {}; // Simulate already loaded stylesheet

    (global as any).document = {
      querySelector: (selector: string) => {
        if (selector === 'link[data-feature-fonts="true"]') {
          return existingElement;
        }
        return null;
      },
    };

    const { loadFeatureFonts } = await getFreshModule('exists_sheet');
    await assert.doesNotReject(loadFeatureFonts());
  });

  await t.test("resolves when existing link finishes loading", async () => {
    const existingElement = new MockElement();
    // No sheet initially

    (global as any).document = {
      querySelector: (selector: string) => {
        if (selector === 'link[data-feature-fonts="true"]') {
          return existingElement;
        }
        return null;
      },
    };

    const { loadFeatureFonts } = await getFreshModule('exists_load');

    const promise = loadFeatureFonts();

    // Trigger load event asynchronously
    setTimeout(() => {
      existingElement.triggerEvent("load");
    }, 10);

    await assert.doesNotReject(promise);
  });

  await t.test("rejects when existing link fails to load", async () => {
    const existingElement = new MockElement();

    (global as any).document = {
      querySelector: (selector: string) => {
        if (selector === 'link[data-feature-fonts="true"]') {
          return existingElement;
        }
        return null;
      },
    };

    const { loadFeatureFonts } = await getFreshModule('exists_error');

    const promise = loadFeatureFonts();

    // Trigger error event asynchronously
    setTimeout(() => {
      existingElement.triggerEvent("error");
    }, 10);

    await assert.rejects(promise, {
      message: "Feature fonts failed to load",
    });
  });

  await t.test("creates new link, appends to head, and resolves on load", async () => {
    const newElement = new MockElement();
    let appendedChild: any = null;

    (global as any).document = {
      querySelector: () => null, // Not found
      createElement: (tagName: string) => {
        if (tagName === "link") return newElement;
        throw new Error(`Unexpected createElement tag: ${tagName}`);
      },
      head: {
        appendChild: (child: any) => {
          appendedChild = child;
        },
      },
    };

    const { loadFeatureFonts } = await getFreshModule('create_load');

    const promise = loadFeatureFonts();

    // Verify properties were set correctly
    assert.strictEqual(newElement.rel, "stylesheet");
    assert.strictEqual(
      newElement.href,
      "https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&family=Cormorant+Garamond:wght@400;500;600;700&display=swap"
    );
    assert.strictEqual(newElement.dataset.featureFonts, "true");
    assert.strictEqual(appendedChild, newElement);

    // Trigger load event asynchronously
    setTimeout(() => {
      newElement.triggerEvent("load");
    }, 10);

    await assert.doesNotReject(promise);
  });

  await t.test("creates new link, appends to head, and rejects on error", async () => {
    const newElement = new MockElement();

    (global as any).document = {
      querySelector: () => null,
      createElement: () => newElement,
      head: {
        appendChild: () => {},
      },
    };

    const { loadFeatureFonts } = await getFreshModule('create_error');

    const promise = loadFeatureFonts();

    // Trigger error event asynchronously
    setTimeout(() => {
      newElement.triggerEvent("error");
    }, 10);

    await assert.rejects(promise, {
      message: "Feature fonts failed to load",
    });
  });

  await t.test("returns the cached promise on subsequent calls", async () => {
    const newElement = new MockElement();
    let queryCallCount = 0;

    (global as any).document = {
      querySelector: () => {
        queryCallCount++;
        return null;
      },
      createElement: () => newElement,
      head: {
        appendChild: () => {},
      },
    };

    const { loadFeatureFonts } = await getFreshModule('cache');

    const promise1 = loadFeatureFonts();
    const promise2 = loadFeatureFonts();

    assert.strictEqual(promise1, promise2);
    // querySelector should only be called once, not twice
    assert.strictEqual(queryCallCount, 1);

    // Resolve so test finishes
    newElement.triggerEvent("load");
    await promise1;
  });
});
