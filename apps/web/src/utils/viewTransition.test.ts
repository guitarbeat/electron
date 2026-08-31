import test from "node:test";
import assert from "node:assert/strict";
import { runWithViewTransition } from "./viewTransition";

test("runWithViewTransition", async (t) => {
  const originalDocument = global.document;

  t.afterEach(() => {
    global.document = originalDocument;
  });

  await t.test("runs update immediately when disabled", () => {
    const updateMock = t.mock.fn();
    runWithViewTransition(updateMock, true);
    assert.equal(updateMock.mock.callCount(), 1);
  });

  await t.test("runs update immediately when document.startViewTransition is not supported", () => {
    // @ts-expect-error - mock document
    global.document = {};

    const updateMock = t.mock.fn();
    runWithViewTransition(updateMock, false);
    assert.equal(updateMock.mock.callCount(), 1);
  });

  await t.test("calls document.startViewTransition with update when supported", () => {
    const startViewTransitionMock = t.mock.fn();
    // @ts-expect-error - mock document
    global.document = {
      startViewTransition: startViewTransitionMock,
    };

    const updateMock = t.mock.fn();
    runWithViewTransition(updateMock, false);
    assert.equal(updateMock.mock.callCount(), 0);
    assert.equal(startViewTransitionMock.mock.callCount(), 1);
    assert.deepEqual(startViewTransitionMock.mock.calls[0].arguments, [updateMock]);
  });
});
