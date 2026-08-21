import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeOptionalDate,
  normalizeOptionalFiniteNumber,
  normalizeOptionalString,
  normalizeOptionalUrl,
  normalizeRecordList,
  normalizeRequiredDate,
  normalizeRequiredString,
} from "./normalization.ts";

test("shared state normalization handles scalar values consistently", () => {
  assert.equal(normalizeRequiredString("  Movie Night  "), "Movie Night");
  assert.equal(normalizeRequiredString("  "), null);
  assert.equal(normalizeOptionalString(42), undefined);
  assert.equal(
    normalizeRequiredDate("2026-08-10T00:00:00.000Z"),
    "2026-08-10T00:00:00.000Z",
  );
  assert.equal(normalizeRequiredDate("not-a-date"), null);
  assert.equal(normalizeOptionalDate(42), undefined);
  assert.equal(normalizeOptionalFiniteNumber(Number.NaN), undefined);
  assert.equal(normalizeOptionalFiniteNumber(4.5), 4.5);
  assert.equal(normalizeOptionalUrl("javascript:alert(1)"), undefined);
  assert.equal(
    normalizeOptionalUrl("https://example.com/poster.jpg"),
    "https://example.com/poster.jpg",
  );
});

test("normalizeRecordList keeps only records accepted by a normalizer", () => {
  const normalized = normalizeRecordList(["one", 2, "three"], (value) =>
    typeof value === "string" ? value.toUpperCase() : null,
  );

  assert.deepEqual(normalized, ["ONE", "THREE"]);
  assert.deepEqual(normalizeRecordList(null, () => "unused"), []);
});
