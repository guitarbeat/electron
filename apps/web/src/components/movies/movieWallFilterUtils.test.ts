import assert from "node:assert/strict";
import test from "node:test";
import type { Movie } from "@/shared/types";
import {
  cycleProgressFilter,
  DEFAULT_MOVIE_WALL_FILTERS,
  filterMovieWall,
  getMovieWallGenres,
  getMovieWallOptionCounts,
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

test("sorts movie list by date added, alphabetical, genre, and rating", () => {
  const sample = [
    { id: "m1", title: "Zodiac", createdAt: "2026-01-01", genre: "Crime, Mystery", imdbRating: "7.7", watchedBy: [] },
    { id: "m2", title: "Alien", createdAt: "2026-01-03", genre: "Sci-Fi, Horror", imdbRating: "8.5", watchedBy: [] },
    { id: "m3", title: "Babylon", createdAt: "2026-01-02", genre: "Comedy, Drama", imdbRating: "7.1", watchedBy: [] },
  ] as Movie[];

  // 1. Date added (most recent first: m2 -> m3 -> m1)
  const byDate = filterMovieWall(sample, { ...DEFAULT_MOVIE_WALL_FILTERS, sortBy: "recent" });
  assert.deepEqual(byDate.map((m) => m.id), ["m2", "m3", "m1"]);

  // 2. Alphabetical (Alien -> Babylon -> Zodiac)
  const byAlpha = filterMovieWall(sample, { ...DEFAULT_MOVIE_WALL_FILTERS, sortBy: "alpha" });
  assert.deepEqual(byAlpha.map((m) => m.id), ["m2", "m3", "m1"]);
  assert.deepEqual(byAlpha.map((m) => m.title), ["Alien", "Babylon", "Zodiac"]);

  // 3. Genre (Comedy -> Crime -> Sci-Fi)
  const byGenre = filterMovieWall(sample, { ...DEFAULT_MOVIE_WALL_FILTERS, sortBy: "genre" });
  assert.deepEqual(byGenre.map((m) => m.title), ["Babylon", "Zodiac", "Alien"]);

  // 4. IMDb Rating (8.5 -> 7.7 -> 7.1)
  const byRating = filterMovieWall(sample, { ...DEFAULT_MOVIE_WALL_FILTERS, sortBy: "rating" });
  assert.deepEqual(byRating.map((m) => m.id), ["m2", "m1", "m3"]);
});

test("computes live option counts and cycles progress filters", () => {
  const sample = [
    { id: "1", title: "Film A", addedBy: "Aaron", watchedBy: [], createdAt: "2026-01-01", mediaType: "movie" },
    { id: "2", title: "Show B", addedBy: "Electra", watchedBy: ["Aaron", "Electra"], createdAt: "2026-01-02", mediaType: "series" },
    { id: "3", title: "Essay C", addedBy: "Electra", watchedBy: [], watchingBy: ["Aaron"], createdAt: "2026-01-03", mediaType: "youtube" },
  ] as Movie[];

  const counts = getMovieWallOptionCounts(sample);
  assert.equal(counts.total, 3);
  assert.deepEqual(counts.formats, { all: 3, movie: 1, series: 1, youtube: 1 });
  assert.deepEqual(counts.presets, { all: 3, queue: 1, in_progress: 1, both_watched: 1 });
  assert.deepEqual(counts.viewers.Aaron, { all: 3, unwatched: 1, watching: 1, watched: 1 });
  assert.deepEqual(counts.viewers.Electra, { all: 3, unwatched: 2, watching: 0, watched: 1 });
  assert.deepEqual(counts.addedBy, { all: 3, Aaron: 1, Electra: 2 });

  assert.equal(cycleProgressFilter("all"), "unwatched");
  assert.equal(cycleProgressFilter("unwatched"), "watching");
  assert.equal(cycleProgressFilter("watching"), "watched");
  assert.equal(cycleProgressFilter("watched"), "all");
});



test("searches cast names case-insensitively and intersects with status filters", () => {
  const castMovies = [
    { id: "cast-1", title: "Arrival", actors: "Amy Adams, Jeremy Renner", watchedBy: [], addedBy: "Aaron", createdAt: "2026-01-01" },
    { id: "cast-2", title: "Other", actors: "Amy Adams", watchedBy: ["Aaron", "Electra"], addedBy: "Electra", createdAt: "2026-01-02" },
  ] as Movie[];
  assert.deepEqual(
    filterMovieWall(castMovies, { ...DEFAULT_MOVIE_WALL_FILTERS, query: "  AMY ADAMS  ", statusPreset: "queue" }).map((movie) => movie.id),
    ["cast-1"],
  );
  assert.equal(filterMovieWall(castMovies, { ...DEFAULT_MOVIE_WALL_FILTERS, query: "no such actor" }).length, 0);
});
