import { describe, it } from "node:test";
import assert from "node:assert";
import { buildCollectionSections, type WorkspaceSection } from "./workspace.ts";

describe("buildCollectionSections", () => {
  it("should return empty array for empty items", () => {
    const result = buildCollectionSections(
      [],
      () => "",
      () => "",
    );
    assert.deepStrictEqual(result, []);
  });

  it("should group items by section id", () => {
    const items = [
      { id: 1, type: "A", name: "One" },
      { id: 2, type: "B", name: "Two" },
      { id: 3, type: "A", name: "Three" },
    ];

    const result = buildCollectionSections(
      items,
      (item) => item.type,
      (item) => `Type ${item.type}`,
    );

    assert.strictEqual(result.length, 2);

    assert.deepStrictEqual(result[0], {
      id: "A",
      header: "Type A",
      items: [
        { id: 1, type: "A", name: "One" },
        { id: 3, type: "A", name: "Three" },
      ],
    });

    assert.deepStrictEqual(result[1], {
      id: "B",
      header: "Type B",
      items: [{ id: 2, type: "B", name: "Two" }],
    });
  });

  it("should sort sections if sort function is provided", () => {
    const items = [
      { id: 1, type: "B", name: "One" },
      { id: 2, type: "A", name: "Two" },
    ];

    const result = buildCollectionSections(
      items,
      (item) => item.type,
      (item) => `Type ${item.type}`,
      (a: any, b: any) => a.id.localeCompare(b.id),
    );

    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].id, "A");
    assert.strictEqual(result[1].id, "B");
  });
});
