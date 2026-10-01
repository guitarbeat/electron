import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { suggestionScopeDefinitions } from "./suggestions.js";
import { mockSuggestions } from "../../../apps/web/src/services/state/mockData.js";
import type { MutationContext } from "../state.js";

const context: MutationContext = {
  currentUser: "Aaron",
  now: "2024-01-01T00:00:00Z",
};

describe("suggestionScopeDefinitions - parse & try-catch error handling", () => {
  it("returns seed state fallback for movie suggestions when JSON parsing throws an error", (t) => {
    t.mock.method(console, "error", () => {});

    const invalidJson = "{ invalid json ";
    const result = suggestionScopeDefinitions.suggestions.parse(invalidJson);

    assert.deepEqual(result, mockSuggestions);
  });

  it("returns empty array fallback for place suggestions when JSON parsing throws an error", (t) => {
    t.mock.method(console, "error", () => {});

    const invalidJson = "{ invalid json ";
    const result = suggestionScopeDefinitions.placeSuggestions.parse(invalidJson);

    assert.deepEqual(result, []);
  });

  it("returns fallback when content is null or empty", () => {
    assert.deepEqual(suggestionScopeDefinitions.suggestions.parse(null), mockSuggestions);
    assert.deepEqual(suggestionScopeDefinitions.placeSuggestions.parse(null), []);
  });

  it("returns fallback when JSON content is valid JSON but not an array", () => {
    const jsonObject = JSON.stringify({ not: "an array" });
    assert.deepEqual(suggestionScopeDefinitions.suggestions.parse(jsonObject), mockSuggestions);
    assert.deepEqual(suggestionScopeDefinitions.placeSuggestions.parse(jsonObject), []);
  });

  it("successfully parses valid array JSON content for movie suggestions", () => {
    const validJson = JSON.stringify([
      {
        id: "sug-1",
        title: "Inception",
        suggestedBy: "Aaron",
        status: "pending",
        createdAt: "2024-01-01T00:00:00Z",
      },
    ]);
    const result = suggestionScopeDefinitions.suggestions.parse(validJson);
    assert.equal(Array.isArray(result), true);
    assert.equal((result as any[]).length, 1);
    assert.equal((result as any[])[0].title, "Inception");
  });

  it("successfully parses valid array JSON content for place suggestions", () => {
    const validJson = JSON.stringify([
      {
        id: "place-1",
        name: "Central Park",
        suggestedBy: "Electra",
        status: "pending",
        createdAt: "2024-01-01T00:00:00Z",
      },
    ]);
    const result = suggestionScopeDefinitions.placeSuggestions.parse(validJson);
    assert.equal(Array.isArray(result), true);
    assert.equal((result as any[]).length, 1);
    assert.equal((result as any[])[0].name, "Central Park");
    assert.equal((result as any[])[0].suggestedBy, "Electra");
  });
});

describe("suggestionScopeDefinitions - mutations", () => {
  it("allows adding a movie suggestion", () => {
    const initial: any[] = [];
    const result = suggestionScopeDefinitions.suggestions.mutate(
      initial,
      "add_suggestion",
      {
        id: "sug-100",
        title: "Interstellar",
      },
      context,
    );

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.data.length, 1);
      assert.equal(result.data[0].title, "Interstellar");
      assert.equal(result.data[0].suggestedBy, "Aaron");
    }
  });

  it("allows adding a place suggestion", () => {
    const initial: any[] = [];
    const result = suggestionScopeDefinitions.placeSuggestions.mutate(
      initial,
      "add_place_suggestion",
      {
        id: "place-100",
        name: "Eiffel Tower",
      },
      context,
    );

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.data.length, 1);
      assert.equal(result.data[0].name, "Eiffel Tower");
      assert.equal(result.data[0].suggestedBy, "Aaron");
    }
  });
});
