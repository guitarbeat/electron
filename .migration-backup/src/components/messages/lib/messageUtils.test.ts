import assert from "node:assert/strict";
import test from "node:test";

import { shouldSubmitMessageOnKeyDown } from "./messageUtils.ts";

test("shouldSubmitMessageOnKeyDown", async (t) => {
  await t.test("submits on Enter", () => {
    assert.equal(
      shouldSubmitMessageOnKeyDown({
        key: "Enter",
        shiftKey: false,
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
      }),
      false,
    );
  });

  await t.test("does not submit while composing text with an IME", () => {
    assert.equal(
      shouldSubmitMessageOnKeyDown({
        key: "Enter",
        shiftKey: false,
        isComposing: true,
      }),
      false,
    );
  });
});
