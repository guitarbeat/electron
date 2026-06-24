import assert from "node:assert/strict";
import test from "node:test";

import { areDeeplyEqual } from "../utils/index.ts";

type Item = { id: string; title: string };

const getCollectionItemId = (item: unknown): string | undefined => {
  if (typeof item !== "object" || item === null || !("id" in item)) {
    return undefined;
  }

  const { id } = item as { id: unknown };
  return typeof id === "string" ? id : undefined;
};

const hasLocalOnlyRows = <T>(current: T[], polled: T[]): boolean => {
  const polledIds = new Set(polled.map(getCollectionItemId).filter(Boolean));
  return current.some((item) => {
    const id = getCollectionItemId(item);
    return Boolean(id && !polledIds.has(id));
  });
};

test("hasLocalOnlyRows detects optimistic rows missing from stale polls", () => {
  const current: Item[] = [
    { id: "existing", title: "Heat" },
    { id: "new-local", title: "New Movie" },
  ];
  const polled: Item[] = [{ id: "existing", title: "Heat" }];

  assert.equal(hasLocalOnlyRows(current, polled), true);
  assert.equal(hasLocalOnlyRows(polled, polled), false);
});

test("areDeeplyEqual treats distinct movie lists as different", () => {
  const left: Item[] = [{ id: "a", title: "A" }];
  const right: Item[] = [
    { id: "a", title: "A" },
    { id: "b", title: "B" },
  ];

  assert.equal(areDeeplyEqual(left, right), false);
});
