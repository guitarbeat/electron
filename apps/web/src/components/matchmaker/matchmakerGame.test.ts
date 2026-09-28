import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Movie } from "../../shared/types.ts";
import {
  getAvailableMatchmakerVibes,
  filterMoviesByVibe,
  SHORT_AND_SWEET_VIBE,
} from "./matchmakerGame.ts";

describe("matchmakerGame utilities", () => {
  const sampleMovies: Movie[] = [
    {
      id: "1",
      title: "Action Movie 1",
      genre: "Action, Sci-Fi",
      category: "Popular",
      addedBy: "Aaron",
      createdAt: "2023-01-01T00:00:00Z",
      runtime: "1 h 30 min",
    },
    {
      id: "2",
      title: "Comedy Movie",
      genre: "Comedy",
      category: "Popular",
      addedBy: "Electra",
      createdAt: "2023-01-02T00:00:00Z",
      runtime: "90m",
    },
    {
      id: "3",
      title: "Long Drama",
      genre: "Drama, Sci-Fi",
      category: "Classics",
      addedBy: "Aaron",
      createdAt: "2023-01-03T00:00:00Z",
      runtime: "2h 15m",
    },
    {
      id: "4",
      title: "Empty Tags Movie",
      genre: "",
      category: undefined,
      addedBy: "Electra",
      createdAt: "2023-01-04T00:00:00Z",
    },
  ];

  describe("getAvailableMatchmakerVibes", () => {
    it("returns most frequent tags up to the specified limit sorted by count and alphabetically", () => {
      // Tags counts:
      // Sci-Fi: 2 (Movies 1, 3)
      // Popular: 2 (Movies 1, 2)
      // Action: 1 (Movie 1)
      // Comedy: 1 (Movie 2)
      // Drama: 1 (Movie 3)
      // Classics: 1 (Movie 3)
      const vibes = getAvailableMatchmakerVibes(sampleMovies, 3);
      assert.strictEqual(vibes.length, 3);
      // Popular and Sci-Fi both have count 2. Alphabetically, Popular comes before Sci-Fi.
      assert.deepStrictEqual(vibes, ["Popular", "Sci-Fi", "Action"]);
    });

    it("handles movies with empty, whitespace, or missing genre/category tags", () => {
      const emptyMovies: Movie[] = [
        {
          id: "10",
          title: "Blank",
          genre: "  ,  ",
          category: "   ",
          addedBy: "Aaron",
          createdAt: "2023-01-01T00:00:00Z",
        },
      ];
      const vibes = getAvailableMatchmakerVibes(emptyMovies);
      assert.deepStrictEqual(vibes, []);
    });
  });

  describe("filterMoviesByVibe", () => {
    it("returns all movies if selectedVibe is null", () => {
      const filtered = filterMoviesByVibe(sampleMovies, null);
      assert.strictEqual(filtered.length, sampleMovies.length);
    });

    it("filters movies by Short & Sweet vibe (< 100 runtime minutes)", () => {
      const filtered = filterMoviesByVibe(sampleMovies, SHORT_AND_SWEET_VIBE);
      // Movie 1: 1h 30m = 90m (< 100)
      // Movie 2: 90m (< 100)
      // Movie 3: 2h 15m = 135m (>= 100)
      assert.strictEqual(filtered.length, 2);
      assert.deepStrictEqual(
        filtered.map((m) => m.id),
        ["1", "2"]
      );
    });

    it("filters movies matching a genre or category tag case-insensitively", () => {
      const filtered = filterMoviesByVibe(sampleMovies, "sci-fi");
      assert.strictEqual(filtered.length, 2);
      assert.deepStrictEqual(
        filtered.map((m) => m.id),
        ["1", "3"]
      );
    });
  });
});
