import assert from "node:assert/strict";
import test, { describe, beforeEach, afterEach } from "node:test";
import {
  copyTextToClipboard,
  prefersReducedMotion,
  hasHoverCapability,
  hasFinePointer,
  isChromaSpotlightEnabled,
  subscribeMotionPreferences,
  getStoredSoundPreference,
  isSoundEnabled,
  setSoundEnabled,
  subscribeSoundPreference,
  scrollToWorkspaceSection,
  loadFeatureFonts,
  runWithViewTransition,
} from "./dom.ts";

describe("dom utilities", () => {
  let originalWindow: typeof globalThis.window;
  let originalDocument: typeof globalThis.document;
  let originalNavigator: typeof globalThis.navigator;

  beforeEach(() => {
    originalWindow = globalThis.window;
    originalDocument = globalThis.document;
    originalNavigator = globalThis.navigator;
  });

  afterEach(() => {
    Object.defineProperty(globalThis, "window", {
      value: originalWindow,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, "document", {
      value: originalDocument,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, "navigator", {
      value: originalNavigator,
      configurable: true,
      writable: true,
    });
  });

  const mockGlobal = (prop: "window" | "document" | "navigator", value: unknown) => {
    Object.defineProperty(globalThis, prop, {
      value,
      configurable: true,
      writable: true,
    });
  };

  describe("copyTextToClipboard", () => {
    test("uses navigator.clipboard.writeText when available", async () => {
      let writtenText = "";
      mockGlobal("navigator", {
        ...originalNavigator,
        clipboard: {
          writeText: async (val: string) => {
            writtenText = val;
          },
        },
      });

      await copyTextToClipboard("hello world");
      assert.strictEqual(writtenText, "hello world");
    });

    test("falls back to textarea execCommand when navigator.clipboard is unavailable", async () => {
      let execCommandCalled = false;
      let commandName = "";
      let appendedChild: HTMLElement | null = null;
      let removedChild: HTMLElement | null = null;
      let focused = false;
      let selected = false;

      const mockTextarea = {
        value: "",
        setAttribute: () => {},
        style: {},
        focus: () => {
          focused = true;
        },
        select: () => {
          selected = true;
        },
      } as unknown as HTMLTextAreaElement;

      mockGlobal("navigator", {});
      mockGlobal("document", {
        createElement: (tag: string) => {
          if (tag === "textarea") return mockTextarea;
          return {} as HTMLElement;
        },
        body: {
          appendChild: (child: HTMLElement) => {
            appendedChild = child;
          },
          removeChild: (child: HTMLElement) => {
            removedChild = child;
          },
        },
        execCommand: (cmd: string) => {
          execCommandCalled = true;
          commandName = cmd;
          return true;
        },
      });

      await copyTextToClipboard("fallback text");

      assert.strictEqual(mockTextarea.value, "fallback text");
      assert.strictEqual(focused, true);
      assert.strictEqual(selected, true);
      assert.strictEqual(execCommandCalled, true);
      assert.strictEqual(commandName, "copy");
      assert.strictEqual(appendedChild, mockTextarea as unknown as HTMLElement);
      assert.strictEqual(removedChild, mockTextarea as unknown as HTMLElement);
    });

    test("throws error when execCommand fails in fallback mode", async () => {
      const mockTextarea = {
        value: "",
        setAttribute: () => {},
        style: {},
        focus: () => {},
        select: () => {},
      } as unknown as HTMLTextAreaElement;

      mockGlobal("navigator", {});
      mockGlobal("document", {
        createElement: () => mockTextarea,
        body: {
          appendChild: () => {},
          removeChild: () => {},
        },
        execCommand: () => false,
      });

      await assert.rejects(
        async () => {
          await copyTextToClipboard("failed copy");
        },
        {
          name: "Error",
          message: "Clipboard unavailable",
        },
      );
    });
  });

  describe("media query helpers", () => {
    test("returns false when window is undefined", () => {
      mockGlobal("window", undefined);

      assert.strictEqual(prefersReducedMotion(), false);
      assert.strictEqual(hasHoverCapability(), false);
      assert.strictEqual(hasFinePointer(), false);
      assert.strictEqual(isChromaSpotlightEnabled(), false);
    });

    test("correctly evaluates matchMedia queries when window is defined", () => {
      const matchesMap: Record<string, boolean> = {
        "(prefers-reduced-motion: reduce)": false,
        "(hover: hover)": true,
        "(pointer: fine)": true,
      };

      mockGlobal("window", {
        matchMedia: (query: string) =>
          ({
            matches: matchesMap[query] ?? false,
          }) as MediaQueryList,
      });

      assert.strictEqual(prefersReducedMotion(), false);
      assert.strictEqual(hasHoverCapability(), true);
      assert.strictEqual(hasFinePointer(), true);
      assert.strictEqual(isChromaSpotlightEnabled(), true);

      // Change reduced motion to true
      matchesMap["(prefers-reduced-motion: reduce)"] = true;
      assert.strictEqual(prefersReducedMotion(), true);
      assert.strictEqual(isChromaSpotlightEnabled(), false);
    });

    test("subscribeMotionPreferences registers and unbinds event listeners", () => {
      const listeners: Record<string, Array<() => void>> = {
        motion: [],
        hover: [],
      };

      const createMq = (key: string) =>
        ({
          addEventListener: (_event: string, cb: () => void) => {
            listeners[key].push(cb);
          },
          removeEventListener: (_event: string, cb: () => void) => {
            listeners[key] = listeners[key].filter((l) => l !== cb);
          },
        }) as unknown as MediaQueryList;

      mockGlobal("window", {
        matchMedia: (query: string) => {
          if (query.includes("prefers-reduced-motion")) return createMq("motion");
          if (query.includes("hover")) return createMq("hover");
          return createMq("other");
        },
      });

      const onChange = () => {};
      const unsubscribe = subscribeMotionPreferences(onChange);

      assert.strictEqual(listeners.motion.length, 1);
      assert.strictEqual(listeners.hover.length, 1);
      assert.strictEqual(listeners.motion[0], onChange);
      assert.strictEqual(listeners.hover[0], onChange);

      unsubscribe();

      assert.strictEqual(listeners.motion.length, 0);
      assert.strictEqual(listeners.hover.length, 0);
    });

    test("subscribeMotionPreferences returns no-op when window is undefined", () => {
      mockGlobal("window", undefined);

      const unsubscribe = subscribeMotionPreferences(() => {});
      assert.doesNotThrow(() => unsubscribe());
    });
  });

  describe("sound preference helpers", () => {
    test("getStoredSoundPreference handles SSR and localStorage values", () => {
      mockGlobal("window", undefined);
      assert.strictEqual(getStoredSoundPreference(), null);

      const storage: Record<string, string> = {};
      mockGlobal("window", {
        localStorage: {
          getItem: (key: string) => storage[key] ?? null,
          setItem: (key: string, val: string) => {
            storage[key] = val;
          },
        },
      });

      assert.strictEqual(getStoredSoundPreference(), null);

      storage["uiSoundsEnabled"] = "true";
      assert.strictEqual(getStoredSoundPreference(), true);

      storage["uiSoundsEnabled"] = "false";
      assert.strictEqual(getStoredSoundPreference(), false);

      storage["uiSoundsEnabled"] = "other";
      assert.strictEqual(getStoredSoundPreference(), null);
    });

    test("getStoredSoundPreference returns null on localStorage error", () => {
      mockGlobal("window", {
        localStorage: {
          getItem: () => {
            throw new Error("SecurityError");
          },
        },
      });

      assert.strictEqual(getStoredSoundPreference(), null);
    });

    test("isSoundEnabled respects explicit preference and falls back to reduced motion check", () => {
      const storage: Record<string, string> = {};
      let reducedMotionMatch = false;

      mockGlobal("window", {
        localStorage: {
          getItem: (key: string) => storage[key] ?? null,
          setItem: (key: string, val: string) => {
            storage[key] = val;
          },
        },
        matchMedia: (query: string) =>
          ({
            matches: query.includes("prefers-reduced-motion") ? reducedMotionMatch : false,
          }) as MediaQueryList,
      });

      // No stored preference, reduced motion false -> true
      assert.strictEqual(isSoundEnabled(), true);

      // No stored preference, reduced motion true -> false
      reducedMotionMatch = true;
      assert.strictEqual(isSoundEnabled(), false);

      // Explicit stored true overrides reduced motion true
      storage["uiSoundsEnabled"] = "true";
      assert.strictEqual(isSoundEnabled(), true);

      // Explicit stored false overrides reduced motion false
      reducedMotionMatch = false;
      storage["uiSoundsEnabled"] = "false";
      assert.strictEqual(isSoundEnabled(), false);
    });

    test("setSoundEnabled and subscribeSoundPreference update localStorage and notify listeners", () => {
      const storage: Record<string, string> = {};
      mockGlobal("window", {
        localStorage: {
          getItem: (key: string) => storage[key] ?? null,
          setItem: (key: string, val: string) => {
            storage[key] = val;
          },
        },
      });

      let callCount = 0;
      const listener = () => {
        callCount++;
      };

      const unsubscribe = subscribeSoundPreference(listener);

      setSoundEnabled(true);
      assert.strictEqual(storage["uiSoundsEnabled"], "true");
      assert.strictEqual(callCount, 1);

      setSoundEnabled(false);
      assert.strictEqual(storage["uiSoundsEnabled"], "false");
      assert.strictEqual(callCount, 2);

      unsubscribe();
      setSoundEnabled(true);
      assert.strictEqual(callCount, 2);
    });

    test("setSoundEnabled handles SSR gracefully", () => {
      mockGlobal("window", undefined);
      assert.doesNotThrow(() => {
        setSoundEnabled(true);
      });
    });

    test("setSoundEnabled ignores quota/privacy mode errors", () => {
      mockGlobal("window", {
        localStorage: {
          setItem: () => {
            throw new Error("QuotaExceededError");
          },
        },
      });

      assert.doesNotThrow(() => {
        setSoundEnabled(true);
      });
    });
  });

  describe("scrollToWorkspaceSection", () => {
    test("returns false when document is undefined or section not found", () => {
      mockGlobal("document", undefined);
      assert.strictEqual(scrollToWorkspaceSection("test"), false);

      mockGlobal("document", {
        getElementById: () => null,
      });
      assert.strictEqual(scrollToWorkspaceSection("test"), false);
    });

    test("scrolls section with smooth/auto behavior depending on motion preference and sets tabindex/focus", () => {
      let scrollIntoViewOptions: ScrollIntoViewOptions | undefined;
      let attributes: Record<string, string> = {};
      let focused = false;

      const sectionEl = {
        scrollIntoView: (opts: ScrollIntoViewOptions) => {
          scrollIntoViewOptions = opts;
        },
        hasAttribute: (attr: string) => attr in attributes,
        setAttribute: (attr: string, val: string) => {
          attributes[attr] = val;
        },
        focus: () => {
          focused = true;
        },
      };

      let reducedMotion = false;
      let rafCallback: FrameRequestCallback | null = null;

      mockGlobal("document", {
        getElementById: (id: string) => (id === "target-section" ? sectionEl : null),
      });

      mockGlobal("window", {
        matchMedia: (query: string) =>
          ({
            matches: query.includes("prefers-reduced-motion") ? reducedMotion : false,
          }) as MediaQueryList,
        requestAnimationFrame: (cb: FrameRequestCallback) => {
          rafCallback = cb;
          return 1;
        },
      });

      const result = scrollToWorkspaceSection("target-section");
      assert.strictEqual(result, true);
      assert.strictEqual(scrollIntoViewOptions?.behavior, "smooth");
      assert.strictEqual(attributes["tabindex"], "-1");

      assert.notStrictEqual(rafCallback, null);
      if (rafCallback) (rafCallback as FrameRequestCallback)(0);
      assert.strictEqual(focused, true);

      reducedMotion = true;
      attributes = { tabindex: "-1" };
      scrollToWorkspaceSection("target-section");
      assert.strictEqual(scrollIntoViewOptions?.behavior, "auto");
    });
  });

  describe("loadFeatureFonts", () => {
    test("resolves false when document is undefined", async () => {
      mockGlobal("document", undefined);
      const result = await loadFeatureFonts();
      assert.strictEqual(result, false);
    });

    test("resolves true immediately if stylesheet already exists", async () => {
      mockGlobal("document", {
        getElementById: (id: string) =>
          id === "electron-feature-fonts" ? ({} as HTMLElement) : null,
      });

      const result = await loadFeatureFonts();
      assert.strictEqual(result, true);
    });

    test("creates link element, appends to head, and resolves true on load", async () => {
      let createdLink: (HTMLLinkElement & { onload?: () => void; onerror?: () => void }) | null = null;
      let appendedLink: HTMLElement | null = null;

      mockGlobal("document", {
        getElementById: () => null,
        createElement: (tag: string) => {
          if (tag === "link") {
            createdLink = {} as unknown as HTMLLinkElement;
            return createdLink;
          }
          return {} as HTMLElement;
        },
        head: {
          appendChild: (child: HTMLElement) => {
            appendedLink = child;
          },
        },
      });

      const promise = loadFeatureFonts();
      assert.strictEqual(createdLink!.id, "electron-feature-fonts");
      assert.strictEqual(createdLink!.rel, "stylesheet");
      assert.strictEqual(appendedLink, createdLink as unknown as HTMLElement);

      createdLink!.onload?.();
      const result = await promise;
      assert.strictEqual(result, true);
    });

    test("resolves false on link error", async () => {
      let createdLink: (HTMLLinkElement & { onload?: () => void; onerror?: () => void }) | null = null;

      mockGlobal("document", {
        getElementById: () => null,
        createElement: () => {
          createdLink = {} as unknown as HTMLLinkElement;
          return createdLink;
        },
        head: {
          appendChild: () => {},
        },
      });

      const promise = loadFeatureFonts();

      createdLink!.onerror?.();
      const result = await promise;
      assert.strictEqual(result, false);
    });
  });

  describe("runWithViewTransition", () => {
    test("runs callback directly if document is undefined or skip is true", () => {
      mockGlobal("document", undefined);

      let called = false;
      runWithViewTransition(() => {
        called = true;
      });
      assert.strictEqual(called, true);

      mockGlobal("document", {});
      called = false;
      runWithViewTransition(() => {
        called = true;
      }, true);
      assert.strictEqual(called, true);
    });

    test("uses startViewTransition when available and reduced motion is false", () => {
      let transitionCallbackRan = false;
      let startViewTransitionCalled = false;

      mockGlobal("document", {
        startViewTransition: (cb: () => void) => {
          startViewTransitionCalled = true;
          cb();
        },
      });

      mockGlobal("window", {
        matchMedia: () => ({ matches: false }) as MediaQueryList,
      });

      runWithViewTransition(() => {
        transitionCallbackRan = true;
      });

      assert.strictEqual(startViewTransitionCalled, true);
      assert.strictEqual(transitionCallbackRan, true);
    });

    test("falls back to running callback directly when reduced motion is true or startViewTransition unavailable", () => {
      let called = false;

      mockGlobal("document", {
        startViewTransition: () => {},
      });

      mockGlobal("window", {
        matchMedia: () => ({ matches: true }) as MediaQueryList,
      });

      runWithViewTransition(() => {
        called = true;
      });
      assert.strictEqual(called, true);

      called = false;
      mockGlobal("document", {});
      mockGlobal("window", {
        matchMedia: () => ({ matches: false }) as MediaQueryList,
      });

      runWithViewTransition(() => {
        called = true;
      });
      assert.strictEqual(called, true);
    });
  });
});
