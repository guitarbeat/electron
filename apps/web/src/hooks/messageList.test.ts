import assert from "node:assert/strict";
import { test } from "node:test";
import { selectVisibleMessages } from "./messageList.ts";

test("an empty inbox stays empty instead of showing sample lines", () => {
  assert.deepEqual(selectVisibleMessages([]), []);
});

test("a missing snapshot stays empty while the request is still loading", () => {
  assert.deepEqual(selectVisibleMessages(undefined), []);
  assert.deepEqual(selectVisibleMessages(null), []);
});

test("server messages are shown unchanged", () => {
  const messages = [{ id: "1", content: "Tonight?" }];
  assert.deepEqual(selectVisibleMessages(messages), messages);
});
