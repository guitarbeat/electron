import test from "node:test";
import assert from "node:assert/strict";
import { scrollToWorkspaceSection } from "./scrollToWorkspaceSection.ts";

test("scrollToWorkspaceSection", async (t) => {
  const originalDocument = global.document;
  const originalWindow = global.window;

  t.afterEach(() => {
    global.document = originalDocument;
    global.window = originalWindow;
  });

  await t.test("returns false if document is undefined", () => {
    // @ts-expect-error - testing undefined document
    global.document = undefined;
    const result = scrollToWorkspaceSection("some-id");
    assert.equal(result, false);
  });

  await t.test("returns false if section is not found", () => {
    // @ts-expect-error - mock document
    global.document = {
      getElementById: (id: string) => null,
    };
    const result = scrollToWorkspaceSection("non-existent-id");
    assert.equal(result, false);
  });

  await t.test("scrolls smooth and focuses section if prefers-reduced-motion is false", () => {
    const scrollIntoViewMock = t.mock.fn();
    const setAttributeMock = t.mock.fn();
    const focusMock = t.mock.fn();
    const hasAttributeMock = t.mock.fn(() => false);

    // @ts-expect-error - mock document
    global.document = {
      getElementById: (id: string) => {
        if (id === "test-section") {
          return {
            scrollIntoView: scrollIntoViewMock,
            hasAttribute: hasAttributeMock,
            setAttribute: setAttributeMock,
            focus: focusMock,
          };
        }
        return null;
      },
    };

    // @ts-expect-error - mock window
    global.window = {
      matchMedia: (query: string) => ({
        matches: false, // prefers-reduced-motion is false
      }),
      requestAnimationFrame: (cb: FrameRequestCallback) => {
        cb(0);
        return 1;
      },
    };

    const result = scrollToWorkspaceSection("test-section");

    assert.equal(result, true);
    assert.equal(scrollIntoViewMock.mock.callCount(), 1);
    assert.deepEqual(scrollIntoViewMock.mock.calls[0].arguments, [
      { behavior: "smooth", block: "start" }
    ]);
    assert.equal(hasAttributeMock.mock.callCount(), 1);
    assert.equal(setAttributeMock.mock.callCount(), 1);
    assert.deepEqual(setAttributeMock.mock.calls[0].arguments, ["tabindex", "-1"]);
    assert.equal(focusMock.mock.callCount(), 1);
    assert.deepEqual(focusMock.mock.calls[0].arguments, [{ preventScroll: true }]);
  });

  await t.test("scrolls auto and focuses section if prefers-reduced-motion is true", () => {
    const scrollIntoViewMock = t.mock.fn();
    const setAttributeMock = t.mock.fn();
    const focusMock = t.mock.fn();
    const hasAttributeMock = t.mock.fn(() => true); // simulate already has tabindex

    // @ts-expect-error - mock document
    global.document = {
      getElementById: (id: string) => {
        if (id === "test-section") {
          return {
            scrollIntoView: scrollIntoViewMock,
            hasAttribute: hasAttributeMock,
            setAttribute: setAttributeMock,
            focus: focusMock,
          };
        }
        return null;
      },
    };

    // @ts-expect-error - mock window
    global.window = {
      matchMedia: (query: string) => ({
        matches: true, // prefers-reduced-motion is true
      }),
      requestAnimationFrame: (cb: FrameRequestCallback) => {
        cb(0);
        return 1;
      },
    };

    const result = scrollToWorkspaceSection("test-section");

    assert.equal(result, true);
    assert.equal(scrollIntoViewMock.mock.callCount(), 1);
    assert.deepEqual(scrollIntoViewMock.mock.calls[0].arguments, [
      { behavior: "auto", block: "start" }
    ]);
    assert.equal(hasAttributeMock.mock.callCount(), 1);
    assert.equal(setAttributeMock.mock.callCount(), 0); // shouldn't set if it already has it
    assert.equal(focusMock.mock.callCount(), 1);
    assert.deepEqual(focusMock.mock.calls[0].arguments, [{ preventScroll: true }]);
  });
});
