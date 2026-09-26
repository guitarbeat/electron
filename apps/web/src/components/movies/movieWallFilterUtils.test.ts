import assert from "node:assert/strict";
import test from "node:test";
import type { Movie } from "@/shared/types";
import {
  DEFAULT_MOVIE_WALL_FILTERS,
  filterMovieWall,
  getMovieWallGenres,
} from "./movieWallFilterUtils";

const movies: Movie[] = [
  { id: "1", title: "Night House", addedBy: "Aaron", watchedBy: ["Aaron"], createdAt: "2026-01-01", genre: "Horror, Mystery", mediaType: "movie" },
  { id: "2", title: "Dark", addedBy: "Electra", watchedBy: ["Aaron", "Electra"], createdAt: "2026-01-02", genre: "Drama, Mystery", mediaType: "series" },
  { id: "3", title: "Raw", addedBy: "Electra", watchedBy: [], createdAt: "2026-01-03", genre: "Drama, Horror" },
];

test("filters the wall across format, genre, and viewer dimensions", () => {
  assert.deepEqual(
    filterMovieWall(movies, {
      ...DEFAULT_MOVIE_WALL_FILTERS,
      format: "movie",
      genre: "Horror",
      Aaron: "watched",
    }).map((movie) => movie.id),
    ["1"],
  );
});

test("supports independent progress and added-by filters", () => {
  movies[2].watchingBy = ["Electra"];
  assert.deepEqual(filterMovieWall(movies, { ...DEFAULT_MOVIE_WALL_FILTERS, Aaron: "watched", Electra: "watched" }).map((movie) => movie.id), ["2"]);
  assert.deepEqual(filterMovieWall(movies, { ...DEFAULT_MOVIE_WALL_FILTERS, Electra: "watching" }).map((movie) => movie.id), ["3"]);
  assert.deepEqual(filterMovieWall(movies, { ...DEFAULT_MOVIE_WALL_FILTERS, Aaron: "unwatched" }).map((movie) => movie.id), ["3"]);
  assert.deepEqual(filterMovieWall(movies, { ...DEFAULT_MOVIE_WALL_FILTERS, addedBy: "Aaron" }).map((movie) => movie.id), ["1"]);
});

test("builds a unique alphabetical genre list", () => {
  assert.deepEqual(getMovieWallGenres(movies), ["Drama", "Horror", "Mystery"]);
});

test("filters by text search query across title, director, and genre", () => {
  const result = filterMovieWall(movies, {
    ...DEFAULT_MOVIE_WALL_FILTERS,
    query: "dark",
  });
  assert.deepEqual(result.map((m) => m.id), ["2"]);
});

test("supports smart TV series detection even without explicit mediaType", () => {
  const sample = [
    { id: "s1", title: "Severance", addedBy: "Aaron", watchedBy: [], createdAt: "2026-01-01", category: "TV Series" },
    { id: "m1", title: "Inception", addedBy: "Aaron", watchedBy: [], createdAt: "2026-01-01" },
    { id: "y1", title: "Video Essay", addedBy: "Aaron", watchedBy: [], createdAt: "2026-01-01", youtubeUrl: "https://youtu.be/xyz" },
  ] as Movie[];

  const seriesOnly = filterMovieWall(sample, { ...DEFAULT_MOVIE_WALL_FILTERS, format: "series" });
  assert.deepEqual(seriesOnly.map((m) => m.id), ["s1"]);

  const moviesOnly = filterMovieWall(sample, { ...DEFAULT_MOVIE_WALL_FILTERS, format: "movie" });
  assert.deepEqual(moviesOnly.map((m) => m.id), ["m1"]);

  const youtubeOnly = filterMovieWall(sample, { ...DEFAULT_MOVIE_WALL_FILTERS, format: "youtube" });
  assert.deepEqual(youtubeOnly.map((m) => m.id), ["y1"]);
});

test("handles status presets (queue, both_watched, in_progress)", () => {
  const sample = [
    { id: "q1", title: "In Queue", addedBy: "Aaron", watchedBy: [], createdAt: "2026-01-01" },
    { id: "p1", title: "Watching", addedBy: "Aaron", watchedBy: [], watchingBy: ["Aaron"], createdAt: "2026-01-01" },
    { id: "w1", title: "Finished", addedBy: "Aaron", watchedBy: ["Aaron", "Electra"], createdAt: "2026-01-01" },
  ] as Movie[];

  const queueResult = filterMovieWall(sample, { ...DEFAULT_MOVIE_WALL_FILTERS, statusPreset: "queue" });
  assert.deepEqual(queueResult.map((m) => m.id), ["q1"]);

  const progressResult = filterMovieWall(sample, { ...DEFAULT_MOVIE_WALL_FILTERS, statusPreset: "in_progress" });
  assert.deepEqual(progressResult.map((m) => m.id), ["p1"]);

  const bothResult = filterMovieWall(sample, { ...DEFAULT_MOVIE_WALL_FILTERS, statusPreset: "both_watched" });
  assert.deepEqual(bothResult.map((m) => m.id), ["w1"]);
});

