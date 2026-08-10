import assert from "node:assert/strict";
import test from "node:test";
import type { Movie } from "@/shared/types";
import { getMovieNotePreview, getMovieWatchStatus } from "./movieDetailsModel.ts";

const movie: Movie = {
  id: "movie-1",
  title: "Arrival",
  addedBy: "Aaron",
  createdAt: "2026-08-10T00:00:00.000Z",
  watchedBy: [],
};

test("movie detail model describes queue and shared-watch states", () => {
  assert.equal(getMovieWatchStatus(movie, 0).label, "Still queued");
  assert.equal(
    getMovieWatchStatus({ ...movie, watchedBy: ["Aaron", "Electra"] }, 1).label,
    "Seen together",
  );
});

test("movie detail model truncates long note previews", () => {
  const preview = getMovieNotePreview(`  ${"a".repeat(100)}  `);
  assert.equal(preview.length, 96);
  assert.match(preview, /\.\.\.$/);
});
