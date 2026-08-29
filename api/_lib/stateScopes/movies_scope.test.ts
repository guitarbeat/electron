import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { movieScopeDefinition } from "./movies.js";
import type { Movie } from "../../../apps/web/src/shared/types.js";
import type { MutationContext } from "../state.js";

const context: MutationContext = {
  currentUser: "Aaron",
  now: "2024-01-01T00:00:00Z",
};

describe("movieScopeDefinition - add_movies", () => {
  it("adds batch of new movies successfully", () => {
    const movies: Movie[] = [
      {
        id: "m-1",
        title: "Matrix",
        addedBy: "Aaron",
        watchedBy: [],
        createdAt: "2024-01-01T00:00:00Z",
      },
    ];

    const result = movieScopeDefinition.mutate(
      movies,
      "add_movies",
      {
        items: [
          { id: "m-2", title: "Inception" },
          { id: "m-3", title: "Interstellar" },
        ],
      },
      context,
    );

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.data.length, 3);
      assert.equal(result.data[1].title, "Inception");
      assert.equal(result.data[2].title, "Interstellar");
    }
  });

  it("returns conflict if movie ID already exists", () => {
    const movies: Movie[] = [
      {
        id: "m-1",
        title: "Matrix",
        addedBy: "Aaron",
        watchedBy: [],
        createdAt: "2024-01-01T00:00:00Z",
      },
    ];

    const result = movieScopeDefinition.mutate(
      movies,
      "add_movies",
      {
        items: [{ id: "m-1", title: "Matrix Reloaded" }],
      },
      context,
    );

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.conflict, "Movie already exists.");
    }
  });

  it("skips movies with duplicate normalized titles in existing list or within batch", () => {
    const movies: Movie[] = [
      {
        id: "m-1",
        title: " The Matrix ",
        addedBy: "Aaron",
        watchedBy: [],
        createdAt: "2024-01-01T00:00:00Z",
      },
    ];

    const result = movieScopeDefinition.mutate(
      movies,
      "add_movies",
      {
        items: [
          { id: "m-2", title: "the matrix" }, // duplicate of existing
          { id: "m-3", title: "Avatar" }, // new
          { id: "m-4", title: " avatar " }, // duplicate within batch
        ],
      },
      context,
    );

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.data.length, 2);
      assert.equal(result.data[1].id, "m-3");
      assert.equal(result.data[1].title, "Avatar");
    }
  });
});
