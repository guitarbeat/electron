import assert from "node:assert/strict";
import test from "node:test";
import {
  isSoundEnabled,
  setSoundEnabled,
  subscribeSoundPreference,
} from "./soundPreference.ts";

const STORAGE_KEY = "uiSoundsEnabled";

const createLocalStorageMock = () => ({
  store: new Map<string, string>(),
  getItem(key: string) {
    return this.store.get(key) ?? null;
  },
  setItem(key: string, value: string) {
    this.store.set(key, value);
  },
  removeItem(key: string) {
    this.store.delete(key);
  },
  clear() {
    this.store.clear();
  },
  key() {
    return null;
  },
  get length() {
    return this.store.size;
  },
});

const installWindowMocks = ({
  reducedMotion = false,
  localStorage = createLocalStorageMock(),
}: {
  reducedMotion?: boolean;
  localStorage?: ReturnType<typeof createLocalStorageMock>;
} = {}) => {
  const matchMedia = ((query: string) => ({
    matches:
      reducedMotion && query.includes("prefers-reduced-motion: reduce"),
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage,
      matchMedia,
    },
  });

  return localStorage;
};

test("isSoundEnabled defaults to true when motion is not reduced", () => {
  installWindowMocks({ reducedMotion: false });
  assert.equal(isSoundEnabled(), true);
});

test("isSoundEnabled defaults to false when motion is reduced and no preference is stored", () => {
  installWindowMocks({ reducedMotion: true });
  assert.equal(isSoundEnabled(), false);
});

test("setSoundEnabled persists explicit user preference", () => {
  const localStorage = installWindowMocks({ reducedMotion: false });

  setSoundEnabled(false);
  assert.equal(localStorage.getItem(STORAGE_KEY), "false");
  assert.equal(isSoundEnabled(), false);

  setSoundEnabled(true);
  assert.equal(localStorage.getItem(STORAGE_KEY), "true");
  assert.equal(isSoundEnabled(), true);
});

test("subscribeSoundPreference notifies listeners when preference changes", () => {
  installWindowMocks({ reducedMotion: false });

  let notifications = 0;
  const unsubscribe = subscribeSoundPreference(() => {
    notifications += 1;
  });

  setSoundEnabled(false);
  assert.equal(notifications, 1);

  unsubscribe();
  setSoundEnabled(true);
  assert.equal(notifications, 1);
});
