import { describe, it, expect } from "vitest";
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

describe("movieWallFilterUtils", () => {
  it("filters the wall across format, genre, and viewer dimensions", () => {
    expect(
      filterMovieWall(movies, {
        ...DEFAULT_MOVIE_WALL_FILTERS,
        format: "movie",
        genre: "Horror",
        Aaron: "watched",
      }).map((movie) => movie.id),
    ).toEqual(["1"]);
  });

  it("supports independent progress and added-by filters", () => {
    movies[2].watchingBy = ["Electra"];
    expect(filterMovieWall(movies, { ...DEFAULT_MOVIE_WALL_FILTERS, Aaron: "watched", Electra: "watched" }).map((movie) => movie.id)).toEqual(["2"]);
    expect(filterMovieWall(movies, { ...DEFAULT_MOVIE_WALL_FILTERS, Electra: "watching" }).map((movie) => movie.id)).toEqual(["3"]);
    expect(filterMovieWall(movies, { ...DEFAULT_MOVIE_WALL_FILTERS, Aaron: "unwatched" }).map((movie) => movie.id)).toEqual(["3"]);
    expect(filterMovieWall(movies, { ...DEFAULT_MOVIE_WALL_FILTERS, addedBy: "Aaron" }).map((movie) => movie.id)).toEqual(["1"]);
  });

  it("builds a unique alphabetical genre list", () => {
    expect(getMovieWallGenres(movies)).toEqual(["Drama", "Horror", "Mystery"]);
  });

  it("filters by text search query across title, director, and genre", () => {
    const result = filterMovieWall(movies, {
      ...DEFAULT_MOVIE_WALL_FILTERS,
      query: "dark",
    });
    expect(result.map((m) => m.id)).toEqual(["2"]);
  });

  it("supports smart TV series detection even without explicit mediaType", () => {
    const sample = [
      { id: "s1", title: "Severance", addedBy: "Aaron", watchedBy: [], createdAt: "2026-01-01", category: "TV Series" },
      { id: "m1", title: "Inception", addedBy: "Aaron", watchedBy: [], createdAt: "2026-01-01" },
      { id: "y1", title: "Video Essay", addedBy: "Aaron", watchedBy: [], createdAt: "2026-01-01", youtubeUrl: "https://youtu.be/xyz" },
    ] as Movie[];

    const seriesOnly = filterMovieWall(sample, { ...DEFAULT_MOVIE_WALL_FILTERS, format: "series" });
    expect(seriesOnly.map((m) => m.id)).toEqual(["s1"]);

    const moviesOnly = filterMovieWall(sample, { ...DEFAULT_MOVIE_WALL_FILTERS, format: "movie" });
    expect(moviesOnly.map((m) => m.id)).toEqual(["m1"]);

    const youtubeOnly = filterMovieWall(sample, { ...DEFAULT_MOVIE_WALL_FILTERS, format: "youtube" });
    expect(youtubeOnly.map((m) => m.id)).toEqual(["y1"]);
  });

  it("handles status presets (queue, both_watched, in_progress)", () => {
    const sample = [
      { id: "q1", title: "In Queue", addedBy: "Aaron", watchedBy: [], createdAt: "2026-01-01" },
      { id: "p1", title: "Watching", addedBy: "Aaron", watchedBy: [], watchingBy: ["Aaron"], createdAt: "2026-01-01" },
      { id: "w1", title: "Finished", addedBy: "Aaron", watchedBy: ["Aaron", "Electra"], createdAt: "2026-01-01" },
    ] as Movie[];

    const queueResult = filterMovieWall(sample, { ...DEFAULT_MOVIE_WALL_FILTERS, statusPreset: "queue" });
    expect(queueResult.map((m) => m.id)).toEqual(["q1"]);

    const progressResult = filterMovieWall(sample, { ...DEFAULT_MOVIE_WALL_FILTERS, statusPreset: "in_progress" });
    expect(progressResult.map((m) => m.id)).toEqual(["p1"]);

    const bothResult = filterMovieWall(sample, { ...DEFAULT_MOVIE_WALL_FILTERS, statusPreset: "both_watched" });
    expect(bothResult.map((m) => m.id)).toEqual(["w1"]);
  });

  it("sorts movie list by date added, alphabetical, genre, and rating", () => {
    const sample = [
      { id: "m1", title: "Zodiac", createdAt: "2026-01-01", genre: "Crime, Mystery", imdbRating: "7.7", watchedBy: [] },
      { id: "m2", title: "Alien", createdAt: "2026-01-03", genre: "Sci-Fi, Horror", imdbRating: "8.5", watchedBy: [] },
      { id: "m3", title: "Babylon", createdAt: "2026-01-02", genre: "Comedy, Drama", imdbRating: "7.1", watchedBy: [] },
    ] as Movie[];

    const byDate = filterMovieWall(sample, { ...DEFAULT_MOVIE_WALL_FILTERS, sortBy: "recent" });
    expect(byDate.map((m) => m.id)).toEqual(["m2", "m3", "m1"]);

    const byAlpha = filterMovieWall(sample, { ...DEFAULT_MOVIE_WALL_FILTERS, sortBy: "alpha" });
    expect(byAlpha.map((m) => m.id)).toEqual(["m2", "m3", "m1"]);
    expect(byAlpha.map((m) => m.title)).toEqual(["Alien", "Babylon", "Zodiac"]);

    const byGenre = filterMovieWall(sample, { ...DEFAULT_MOVIE_WALL_FILTERS, sortBy: "genre" });
    expect(byGenre.map((m) => m.title)).toEqual(["Babylon", "Zodiac", "Alien"]);

    const byRating = filterMovieWall(sample, { ...DEFAULT_MOVIE_WALL_FILTERS, sortBy: "rating" });
    expect(byRating.map((m) => m.id)).toEqual(["m2", "m1", "m3"]);
  });

  it("computes live option counts and cycles progress filters", () => {
    const sample = [
      { id: "1", title: "Film A", addedBy: "Aaron", watchedBy: [], createdAt: "2026-01-01", mediaType: "movie" },
      { id: "2", title: "Show B", addedBy: "Electra", watchedBy: ["Aaron", "Electra"], createdAt: "2026-01-02", mediaType: "series" },
      { id: "3", title: "Essay C", addedBy: "Electra", watchedBy: [], watchingBy: ["Aaron"], createdAt: "2026-01-03", mediaType: "youtube" },
    ] as Movie[];

    const counts = getMovieWallOptionCounts(sample);
    expect(counts.total).toBe(3);
    expect(counts.formats).toEqual({ all: 3, movie: 1, series: 1, youtube: 1 });
    expect(counts.presets).toEqual({ all: 3, queue: 1, in_progress: 1, both_watched: 1 });
    expect(counts.viewers.Aaron).toEqual({ all: 3, unwatched: 1, watching: 1, watched: 1 });
    expect(counts.viewers.Electra).toEqual({ all: 3, unwatched: 2, watching: 0, watched: 1 });
    expect(counts.addedBy).toEqual({ all: 3, Aaron: 1, Electra: 2 });

    expect(cycleProgressFilter("all")).toBe("unwatched");
    expect(cycleProgressFilter("unwatched")).toBe("watching");
    expect(cycleProgressFilter("watching")).toBe("watched");
    expect(cycleProgressFilter("watched")).toBe("all");
  });

  it("searches cast names case-insensitively and intersects with status filters", () => {
    const castMovies = [
      { id: "cast-1", title: "Arrival", actors: "Amy Adams, Jeremy Renner", watchedBy: [], addedBy: "Aaron", createdAt: "2026-01-01" },
      { id: "cast-2", title: "Other", actors: "Amy Adams", watchedBy: ["Aaron", "Electra"], addedBy: "Electra", createdAt: "2026-01-02" },
    ] as Movie[];
    expect(
      filterMovieWall(castMovies, { ...DEFAULT_MOVIE_WALL_FILTERS, query: "  AMY ADAMS  ", statusPreset: "queue" }).map((movie) => movie.id),
    ).toEqual(["cast-1"]);
    expect(filterMovieWall(castMovies, { ...DEFAULT_MOVIE_WALL_FILTERS, query: "no such actor" }).length).toBe(0);
  });
});
