import { describe, it } from "node:test";
import assert from "node:assert";
import {
  buildCollectionSections,
  compareCreatedAtDesc,
  compareStringsAlpha,
  getWorkspaceCollectionState,
} from "./workspace.ts";

describe("buildCollectionSections", () => {
  it("returns empty sections for empty items", () => {
    const result = buildCollectionSections([], [], () => false);
    assert.deepStrictEqual(result, {
      suggestions: [],
      queue: [],
      completed: [],
    });
  });

  it("splits items into queue and completed", () => {
    const items = [
      { id: 1, name: "Queue" },
      { id: 2, name: "Done" },
    ];
    const suggestions = [{ id: "s1", title: "Suggest" }];

    const result = buildCollectionSections(
      items,
      suggestions,
      (item) => item.id === 2,
    );

    assert.deepStrictEqual(result.suggestions, suggestions);
    assert.deepStrictEqual(result.queue, [{ id: 1, name: "Queue" }]);
    assert.deepStrictEqual(result.completed, [{ id: 2, name: "Done" }]);
  });
});

describe("workspace sort helpers", () => {
  it("compareCreatedAtDesc sorts newest first", () => {
    const older = { createdAt: "2026-01-01T00:00:00.000Z" };
    const newer = { createdAt: "2026-02-01T00:00:00.000Z" };

    assert.ok(compareCreatedAtDesc(newer, older) < 0);
    assert.ok(compareCreatedAtDesc(older, newer) > 0);
  });

  it("compareStringsAlpha sorts case-insensitively", () => {
    assert.ok(compareStringsAlpha("alpha", "Beta") < 0);
    assert.equal(compareStringsAlpha("same", "same"), 0);
  });
});

describe("getWorkspaceCollectionState", () => {
  it("selects loading, empty, and content states", () => {
    assert.equal(
      getWorkspaceCollectionState({
        itemCount: 0,
        suggestionCount: 0,
        isLoadingItems: true,
        isLoadingSuggestions: true,
      }),
      "loading",
    );
    assert.equal(
      getWorkspaceCollectionState({
        itemCount: 0,
        suggestionCount: 0,
        isLoadingItems: false,
        isLoadingSuggestions: false,
      }),
      "empty",
    );
    assert.equal(
      getWorkspaceCollectionState({
        itemCount: 1,
        suggestionCount: 0,
        isLoadingItems: true,
        isLoadingSuggestions: false,
      }),
      "content",
    );
  });
});
