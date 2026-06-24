import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizePlaceSuggestionRecord,
  normalizePlaceSuggestions,
  normalizeSuggestionRecord,
  normalizeSuggestions,
} from "./stateSchemas.ts";

test("normalizeSuggestionRecord", async (t) => {
  await t.test(
    "accepts valid suggestion records with optional selection metadata",
    () => {
      const raw = {
        id: "s1",
        title: "Heat",
        suggestedBy: "Aaron",
        imdbID: "tt0113277",
        type: "movie",
        status: "pending",
        createdAt: "2026-03-27T10:00:00.000Z",
      };

      const normalized = normalizeSuggestionRecord(raw);
      assert.notEqual(normalized, null);
      assert.equal(normalized?.imdbID, "tt0113277");
      assert.equal(normalized?.type, "movie");
    },
  );

  await t.test(
    "drops invalid selection metadata while keeping the suggestion",
    () => {
      const raw = {
        id: "s1",
        title: "Heat",
        suggestedBy: "Aaron",
        imdbID: 42,
        type: "unknown",
        status: "pending",
        createdAt: "2026-03-27T10:00:00.000Z",
      };

      const normalized = normalizeSuggestionRecord(raw);
      assert.notEqual(normalized, null);
      assert.equal(normalized?.imdbID, undefined);
      assert.equal(normalized?.type, undefined);
    },
  );
});

test("normalizeSuggestions keeps valid suggestion records", () => {
  const normalized = normalizeSuggestions([
    {
      id: "s1",
      title: "Heat",
      suggestedBy: "Aaron",
      imdbID: "tt0113277",
      type: "movie",
      status: "pending",
      createdAt: "2026-03-27T10:00:00.000Z",
    },
    { invalid: "record" },
  ]);

  assert.equal(normalized.length, 1);
  assert.equal(normalized[0]?.imdbID, "tt0113277");
  assert.equal(normalized[0]?.type, "movie");
});

test("normalizePlaceSuggestionRecord", async (t) => {
  await t.test("accepts valid record", () => {
    const raw = {
      id: "ps1",
      name: "Test Place",
      suggestedBy: "Aaron",
      status: "pending",
      createdAt: "2026-03-27T10:00:00.000Z",
    };

    const normalized = normalizePlaceSuggestionRecord(raw);
    assert.notEqual(normalized, null);
    assert.equal(normalized?.id, "ps1");
    assert.equal(normalized?.name, "Test Place");
    assert.equal(normalized?.status, "pending");
    assert.equal(normalized?.suggestedBy, "Aaron");
  });

  await t.test("rejects missing required fields", () => {
    assert.equal(normalizePlaceSuggestionRecord({ id: "ps1" }), null);
    assert.equal(normalizePlaceSuggestionRecord({ name: "Test Place" }), null);
  });

  await t.test("accepts guest suggester names", () => {
    const raw = {
      id: "ps1",
      name: "Test Place",
      suggestedBy: "Movie Night Guest",
      status: "pending",
      createdAt: "2026-03-27T10:00:00.000Z",
    };

    const normalized = normalizePlaceSuggestionRecord(raw);
    assert.notEqual(normalized, null);
    assert.equal(normalized?.suggestedBy, "Movie Night Guest");
  });

  await t.test("rejects invalid status", () => {
    const raw = {
      id: "ps1",
      name: "Test Place",
      suggestedBy: "Aaron",
      status: "unknown",
      createdAt: "2026-03-27T10:00:00.000Z",
    };
    assert.equal(normalizePlaceSuggestionRecord(raw), null);
  });

  await t.test("includes optional metadata", () => {
    const raw = {
      id: "ps1",
      name: "Test Place",
      suggestedBy: "Aaron",
      status: "pending",
      createdAt: "2026-03-27T10:00:00.000Z",
      notes: "Some notes",
      category: "Restaurant",
      rating: "4.5",
      imageUrl: "https://example.com/image.jpg",
    };

    const normalized = normalizePlaceSuggestionRecord(raw);
    assert.equal(normalized?.notes, "Some notes");
    assert.equal(normalized?.category, "Restaurant");
    assert.equal(normalized?.rating, "4.5");
    assert.equal(normalized?.imageUrl, "https://example.com/image.jpg");
  });
});

test("normalizePlaceSuggestions", () => {
  const raw = [
    {
      id: "ps1",
      name: "Test Place",
      suggestedBy: "Aaron",
      status: "pending",
      createdAt: "2026-03-27T10:00:00.000Z",
    },
    { invalid: "record" },
  ];

  const normalized = normalizePlaceSuggestions(raw);
  assert.equal(normalized.length, 1);
  assert.equal(normalized[0].id, "ps1");
});
