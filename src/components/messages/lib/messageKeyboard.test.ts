import assert from "node:assert/strict";
import test from "node:test";

import { shouldSubmitMessageOnKeyDown } from "./messageKeyboard.ts";

test("shouldSubmitMessageOnKeyDown", async (t) => {
  await t.test("submits on Enter", () => {
    assert.equal(
      shouldSubmitMessageOnKeyDown({
        key: "Enter",
        shiftKey: false,
        metaKey: false,
        ctrlKey: false,
      }),
      true,
    );
  });

  await t.test(
    "does not submit on Shift+Enter so the user can insert a newline",
    () => {
      assert.equal(
        shouldSubmitMessageOnKeyDown({
          key: "Enter",
          shiftKey: true,
          metaKey: false,
          ctrlKey: false,
        }),
        false,
      );
    },
  );

  await t.test("ignores non-Enter keys", () => {
    assert.equal(
      shouldSubmitMessageOnKeyDown({
        key: "a",
        shiftKey: false,
        metaKey: false,
        ctrlKey: false,
      }),
      false,
    );
  });

  await t.test("does not submit while composing text with an IME", () => {
    assert.equal(
      shouldSubmitMessageOnKeyDown({
        key: "Enter",
        shiftKey: false,
        metaKey: false,
        ctrlKey: false,
        isComposing: true,
      }),
      false,
    );
  });
});
