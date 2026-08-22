import { test } from "node:test";
import assert from "node:assert/strict";
import { isTvSeries, filterMoviesByMediaType, getMediaType } from "./index.ts";
import type { Movie } from "@/shared/types";

test("isTvSeries correctly identifies TV series vs Movies", () => {
  const movie: Partial<Movie> = { title: "Inception", year: "2010", runtime: "148 min" };
  const series: Partial<Movie> = { title: "Breaking Bad", year: "2008–2013", mediaType: "series" };
  const seriesByRuntime: Partial<Movie> = { title: "The Office", runtime: "9 Seasons" };
  const seriesByCategory: Partial<Movie> = { title: "Severance", category: "TV Series" };

  assert.equal(isTvSeries(movie), false);
  assert.equal(getMediaType(movie), "movie");

  assert.equal(isTvSeries(series), true);
  assert.equal(getMediaType(series), "series");

  assert.equal(isTvSeries(seriesByRuntime), true);
  assert.equal(isTvSeries(seriesByCategory), true);
});

test("filterMoviesByMediaType filters array correctly", () => {
  const items = [
    { id: "1", title: "Inception", mediaType: "movie" },
    { id: "2", title: "Breaking Bad", mediaType: "series" },
    { id: "3", title: "The Office", runtime: "9 Seasons" },
  ] as Movie[];

  assert.equal(filterMoviesByMediaType(items, "all").length, 3);
  assert.equal(filterMoviesByMediaType(items, "movie").length, 1);
  assert.equal(filterMoviesByMediaType(items, "series").length, 2);
});
