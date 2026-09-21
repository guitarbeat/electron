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
