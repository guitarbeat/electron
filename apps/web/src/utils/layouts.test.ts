import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { spacing } from "../theme/tokens.js";
import {
  buildCollectionSections,
  cn,
  compareCreatedAtAsc,
  compareCreatedAtDesc,
  compareStringsAlpha,
  getWorkspaceCollectionState,
  layouts,
} from "./layouts.ts";

describe("layouts utilities", () => {
  describe("cn", () => {
    it("merges class names correctly with clsx and twMerge", () => {
      assert.strictEqual(
        cn("px-2 py-1", "bg-red-500", { "text-white": true, hidden: false }),
        "px-2 py-1 bg-red-500 text-white",
      );
      assert.strictEqual(cn("p-4", "p-2"), "p-2");
    });
  });

  describe("layouts style generators", () => {
    it("centeredContainer returns default style object", () => {
      assert.deepStrictEqual(layouts.centeredContainer, {
        maxWidth: "1200px",
        margin: "0 auto",
        padding: `0 ${spacing.md}`,
      });
    });

    it("grid generates expected grid layout styles with defaults and custom parameters", () => {
      assert.deepStrictEqual(layouts.grid(), {
        display: "grid",
        gridTemplateColumns: "repeat(1, 1fr)",
        gap: spacing.md,
      });
      assert.deepStrictEqual(layouts.grid(3, "16px"), {
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "16px",
      });
    });

    it("stack generates column flex styles with defaults and custom gap", () => {
      assert.deepStrictEqual(layouts.stack(), {
        display: "flex",
        flexDirection: "column",
        gap: spacing.md,
      });
      assert.deepStrictEqual(layouts.stack("20px"), {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      });
    });

    it("inlineStack generates centered inline flex styles", () => {
      assert.deepStrictEqual(layouts.inlineStack(), {
        display: "flex",
        alignItems: "center",
        gap: spacing.md,
      });
      assert.deepStrictEqual(layouts.inlineStack("8px"), {
        display: "flex",
        alignItems: "center",
        gap: "8px",
      });
    });

    it("flexRow generates row flex layout with custom alignment and justification", () => {
      assert.deepStrictEqual(layouts.flexRow(), {
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        gap: spacing.md,
      });
      assert.deepStrictEqual(layouts.flexRow("center", "flex-end", "12px"), {
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "flex-end",
        gap: "12px",
      });
    });

    it("flexColumn generates column flex layout with custom alignment and justification", () => {
      assert.deepStrictEqual(layouts.flexColumn(), {
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "stretch",
        gap: spacing.md,
      });
      assert.deepStrictEqual(
        layouts.flexColumn("space-between", "center", "10px"),
        {
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "10px",
        },
      );
    });

    it("spaceBetween generates flex layout with space-between positioning", () => {
      assert.deepStrictEqual(layouts.spaceBetween(), {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: spacing.md,
      });
      assert.deepStrictEqual(layouts.spaceBetween("column", "15px"), {
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "stretch",
        gap: "15px",
      });
    });
  });

  describe("getWorkspaceCollectionState", () => {
    it("returns 'content' if items or suggestions count > 0", () => {
      assert.strictEqual(
        getWorkspaceCollectionState({
          itemCount: 1,
          suggestionCount: 0,
          isLoadingItems: false,
          isLoadingSuggestions: false,
        }),
        "content",
      );
      assert.strictEqual(
        getWorkspaceCollectionState({
          itemCount: 0,
          suggestionCount: 2,
          isLoadingItems: true,
          isLoadingSuggestions: false,
        }),
        "content",
      );
    });

    it("returns 'loading' if item or suggestion loading state is true when count is 0", () => {
      assert.strictEqual(
        getWorkspaceCollectionState({
          itemCount: 0,
          suggestionCount: 0,
          isLoadingItems: true,
          isLoadingSuggestions: false,
        }),
        "loading",
      );
      assert.strictEqual(
        getWorkspaceCollectionState({
          itemCount: 0,
          suggestionCount: 0,
          isLoadingItems: false,
          isLoadingSuggestions: true,
        }),
        "loading",
      );
    });

    it("returns 'empty' if counts are 0 and loading is false", () => {
      assert.strictEqual(
        getWorkspaceCollectionState({
          itemCount: 0,
          suggestionCount: 0,
          isLoadingItems: false,
          isLoadingSuggestions: false,
        }),
        "empty",
      );
    });
  });

  describe("sorting functions", () => {
    it("compareCreatedAtDesc sorts items descending by createdAt", () => {
      const itemA = { createdAt: "2023-01-01T00:00:00.000Z" };
      const itemB = { createdAt: "2023-06-01T00:00:00.000Z" };
      assert.ok(compareCreatedAtDesc(itemA, itemB) > 0);
      assert.ok(compareCreatedAtDesc(itemB, itemA) < 0);
      assert.strictEqual(compareCreatedAtDesc(itemA, itemA), 0);
    });

    it("compareCreatedAtAsc sorts items ascending by createdAt", () => {
      const itemA = { createdAt: "2023-01-01T00:00:00.000Z" };
      const itemB = { createdAt: "2023-06-01T00:00:00.000Z" };
      assert.ok(compareCreatedAtAsc(itemA, itemB) < 0);
      assert.ok(compareCreatedAtAsc(itemB, itemA) > 0);
      assert.strictEqual(compareCreatedAtAsc(itemA, itemA), 0);
    });

    it("compareStringsAlpha performs case-insensitive locale string comparison", () => {
      assert.ok(compareStringsAlpha("apple", "banana") < 0);
      assert.ok(compareStringsAlpha("banana", "apple") > 0);
      assert.strictEqual(compareStringsAlpha("Apple", "apple"), 0);
    });
  });

  describe("buildCollectionSections", () => {
    it("partitions items into queue and completed sections according to isCompleted predicate", () => {
      const items = [
        { id: 1, done: false },
        { id: 2, done: true },
        { id: 3, done: false },
        { id: 4, done: true },
      ];
      const suggestions = [{ id: 10, title: "Suggested" }];

      const result = buildCollectionSections(
        items,
        suggestions,
        (item) => item.done,
      );

      assert.deepStrictEqual(result.suggestions, suggestions);
      assert.deepStrictEqual(result.queue, [
        { id: 1, done: false },
        { id: 3, done: false },
      ]);
      assert.deepStrictEqual(result.completed, [
        { id: 2, done: true },
        { id: 4, done: true },
      ]);
    });

    it("defaults suggestions to empty array if omitted", () => {
      const items = [{ id: 1, done: false }];
      const result = buildCollectionSections(
        items,
        undefined,
        (item) => item.done,
      );

      assert.deepStrictEqual(result.suggestions, []);
      assert.deepStrictEqual(result.queue, [{ id: 1, done: false }]);
      assert.deepStrictEqual(result.completed, []);
    });

    it("handles empty items array", () => {
      const result = buildCollectionSections([], ["sug1"], () => false);

      assert.deepStrictEqual(result.suggestions, ["sug1"]);
      assert.deepStrictEqual(result.queue, []);
      assert.deepStrictEqual(result.completed, []);
    });

    it("places all items into completed when predicate returns true for all", () => {
      const items = [
        { id: 1, done: true },
        { id: 2, done: true },
      ];
      const result = buildCollectionSections(items, [], (item) => item.done);

      assert.deepStrictEqual(result.queue, []);
      assert.deepStrictEqual(result.completed, items);
    });

    it("places all items into queue when predicate returns false for all", () => {
      const items = [
        { id: 1, done: false },
        { id: 2, done: false },
      ];
      const result = buildCollectionSections(items, [], (item) => item.done);

      assert.deepStrictEqual(result.queue, items);
      assert.deepStrictEqual(result.completed, []);
    });

    it("preserves relative item order within queue and completed arrays", () => {
      const items = [
        { id: 10, done: false },
        { id: 20, done: true },
        { id: 30, done: false },
        { id: 40, done: true },
        { id: 50, done: false },
      ];

      const result = buildCollectionSections(items, [], (item) => item.done);

      assert.deepStrictEqual(
        result.queue.map((i) => i.id),
        [10, 30, 50],
      );
      assert.deepStrictEqual(
        result.completed.map((i) => i.id),
        [20, 40],
      );
    });
  });
});
