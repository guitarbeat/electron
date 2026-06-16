import { describe, it } from "node:test";
import assert from "node:assert";
import { buildCollectionSections } from "./workspace.ts";

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
