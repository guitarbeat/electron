import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { messagesScopeDefinition } from "./content.js";
import { MAX_MESSAGE_LENGTH } from "../common.js";
import type { Message } from "../../../apps/web/src/shared/types.js";
import type { MutationContext } from "../state.js";

const context: MutationContext = {
  currentUser: "Aaron",
  now: "2024-01-01T00:00:00Z",
};

describe("messagesScopeDefinition - add_message MAX_MESSAGE_LENGTH validation", () => {
  it("allows adding a message with content length exactly equal to MAX_MESSAGE_LENGTH", () => {
    const messages: Message[] = [];
    const validContent = "a".repeat(MAX_MESSAGE_LENGTH);

    const result = messagesScopeDefinition.mutate(
      messages,
      "add_message",
      {
        id: "msg-valid",
        content: validContent,
      },
      context,
    );

    assert.equal(result.ok, true);
    if (result.ok) {
      const addedMessages = result.data as Message[];
      assert.equal(addedMessages.length, 1);
      assert.equal(addedMessages[0].content, validContent);
      assert.equal(addedMessages[0].content.length, MAX_MESSAGE_LENGTH);
    }
  });

  it("rejects adding a message with content length exceeding MAX_MESSAGE_LENGTH", () => {
    const messages: Message[] = [];
    const invalidContent = "a".repeat(MAX_MESSAGE_LENGTH + 1);

    const result = messagesScopeDefinition.mutate(
      messages,
      "add_message",
      {
        id: "msg-invalid",
        content: invalidContent,
      },
      context,
    );

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.conflict, "Invalid message content.");
    }
  });

  it("rejects adding a message with empty content", () => {
    const messages: Message[] = [];

    const result = messagesScopeDefinition.mutate(
      messages,
      "add_message",
      {
        id: "msg-empty",
        content: "",
      },
      context,
    );

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.conflict, "Invalid message content.");
    }
  });
});
