import assert from "node:assert/strict";
import test from "node:test";
import {
  APP_VIEW_STATE_KEY,
  hasLaunchUrlShortcuts,
  parseMainTab,
  readInitialAppViewState,
  readInitialMainTab,
  readStoredAppViewState,
  stripLaunchUrlShortcuts,
} from "./appViewState.ts";

interface MockWindowOptions {
  hash?: string;
  search?: string;
  pathname?: string;
  storage?: Map<string, string>;
  replaceState?: (state: unknown, title: string, url: string) => void;
}

const withMockWindow = (
  options: MockWindowOptions,
  run: () => void,
): void => {
  const storage = options.storage ?? new Map<string, string>();
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
      location: {
        hash: options.hash ?? "",
        search: options.search ?? "",
        pathname: options.pathname ?? "/",
      },
      history: {
        replaceState: (
          _state: unknown,
          _title: string,
          url: string,
        ) => {
          options.replaceState?.(_state, _title, url);
        },
      },
    },
  });

  try {
    run();
  } finally {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  }
};

test("parseMainTab accepts known tabs and rejects unknown values", () => {
  assert.equal(parseMainTab("movies"), "movies");
  assert.equal(parseMainTab("places"), "places");
  assert.equal(parseMainTab(""), null);
  assert.equal(parseMainTab(null), null);
  assert.equal(parseMainTab("games"), null);
});

test("readStoredAppViewState returns null for missing or corrupt storage", () => {
  withMockWindow({}, () => {
    assert.equal(readStoredAppViewState(), null);
  });

  withMockWindow(
    {
      storage: new Map([[APP_VIEW_STATE_KEY, "{not-json"]]),
    },
    () => {
      assert.equal(readStoredAppViewState(), null);
    },
  );
});

test("readStoredAppViewState normalizes stored tabs and message flag", () => {
  withMockWindow(
    {
      storage: new Map([
        [
          APP_VIEW_STATE_KEY,
          JSON.stringify({ activeTab: "places", showMessages: true }),
        ],
      ]),
    },
    () => {
      assert.deepEqual(readStoredAppViewState(), {
        activeTab: "places",
        showMessages: true,
      });
    },
  );

  withMockWindow(
    {
      storage: new Map([
        [APP_VIEW_STATE_KEY, JSON.stringify({ activeTab: "unknown" })],
      ]),
    },
    () => {
      assert.deepEqual(readStoredAppViewState(), {
        activeTab: "movies",
        showMessages: false,
      });
    },
  );
});

test("readInitialAppViewState prefers hash over query and stored state", () => {
  withMockWindow(
    {
      hash: "#places",
      search: "?tab=movies&panel=messages",
      storage: new Map([
        [
          APP_VIEW_STATE_KEY,
          JSON.stringify({ activeTab: "movies", showMessages: false }),
        ],
      ]),
    },
    () => {
      assert.deepEqual(readInitialAppViewState(), {
        activeTab: "places",
        showMessages: true,
      });
    },
  );
});

test("readInitialAppViewState uses query tab when hash is absent", () => {
  withMockWindow(
    {
      search: "?tab=places",
      storage: new Map([
        [
          APP_VIEW_STATE_KEY,
          JSON.stringify({ activeTab: "movies", showMessages: false }),
        ],
      ]),
    },
    () => {
      assert.deepEqual(readInitialAppViewState(), {
        activeTab: "places",
        showMessages: false,
      });
      assert.equal(readInitialMainTab(), "places");
    },
  );
});

test("readInitialMainTab falls back to stored tab then movies", () => {
  withMockWindow(
    {
      storage: new Map([
        [
          APP_VIEW_STATE_KEY,
          JSON.stringify({ activeTab: "places", showMessages: false }),
        ],
      ]),
    },
    () => {
      assert.equal(readInitialMainTab(), "places");
    },
  );

  withMockWindow({}, () => {
    assert.deepEqual(readInitialAppViewState(), {
      activeTab: "movies",
      showMessages: false,
    });
  });
});

test("launch URL helpers detect and strip one-time shortcuts", () => {
  let replacedUrl = "";

  withMockWindow(
    {
      search: "?tab=places",
      replaceState: (_state, _title, url) => {
        replacedUrl = url;
      },
    },
    () => {
      assert.equal(hasLaunchUrlShortcuts(), true);
      stripLaunchUrlShortcuts();
      assert.equal(replacedUrl, "/");
    },
  );

  withMockWindow({}, () => {
    assert.equal(hasLaunchUrlShortcuts(), false);
    stripLaunchUrlShortcuts();
  });
});
