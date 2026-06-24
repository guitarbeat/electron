import assert from "node:assert/strict";
import test from "node:test";
import { mergeMissingMovieMetadata } from "../services/content/movieRecords.ts";
import type { Movie } from "../shared/types.ts";
import {
  findMovieByNormalizedTitle,
  normalizeMovieTitle,
} from "./shared.ts";

const baseMovie = (overrides: Partial<Movie> = {}): Movie => ({
  id: "movie-1",
  title: "Gone Girl",
  addedBy: "Aaron",
  watchedBy: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

test("normalizeMovieTitle", async (t) => {
  await t.test("ignores case and extra whitespace", () => {
    assert.equal(normalizeMovieTitle("  Gone   Girl  "), "gone girl");
  });
});

test("findMovieByNormalizedTitle", async (t) => {
  const movies = [
    baseMovie({ id: "1", title: "Gone Girl" }),
    baseMovie({ id: "2", title: "The Goonies" }),
  ];

  await t.test("matches titles case-insensitively", () => {
    assert.equal(
      findMovieByNormalizedTitle(movies, "gone girl")?.id,
      "1",
    );
  });

  await t.test("matches titles with collapsed whitespace", () => {
    assert.equal(
      findMovieByNormalizedTitle(movies, "  gone   girl ")?.id,
      "1",
    );
  });

  await t.test("returns undefined when no match exists", () => {
    assert.equal(findMovieByNormalizedTitle(movies, "Inception"), undefined);
  });
});

test("mergeMissingMovieMetadata", async (t) => {
  await t.test("fills only empty fields on the existing movie", () => {
    const existing = baseMovie({
      year: "2014",
      plot: undefined,
      posterUrl: undefined,
    });

    const patch = mergeMissingMovieMetadata(existing, {
      year: "2015",
      plot: "A thriller.",
      posterUrl: "https://example.com/poster.jpg",
    });

    assert.deepEqual(patch, {
      plot: "A thriller.",
      posterUrl: "https://example.com/poster.jpg",
    });
  });

  await t.test("returns null when there is nothing to merge", () => {
    const existing = baseMovie({
      year: "2014",
      plot: "Already set.",
    });

    assert.equal(
      mergeMissingMovieMetadata(existing, {
        year: "2015",
        plot: "New plot.",
      }),
      null,
    );
  });
});
