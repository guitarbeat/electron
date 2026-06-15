import assert from "node:assert/strict";
import test from "node:test";

import type { Movie } from "@/shared/types";
import { getMovieActionState } from "./movieActionState.ts";

const createMovie = (overrides: Partial<Movie> = {}): Movie => ({
  id: "movie-1",
  title: "Heat",
  addedBy: "Aaron",
  watchedBy: [],
  createdAt: "2026-03-27T00:00:00.000Z",
  ...overrides,
});

test("getMovieActionState exposes movie action labels and visibility", async (t) => {
  await t.test("logged-in unwatched movie with no notes", () => {
    const state = getMovieActionState({
      movie: createMovie(),
      currentUser: "Aaron",
      memoriesCount: 0,
    });

    assert.equal(state.showActionRail, true);
    assert.equal(state.showWatchedAction, true);
    assert.equal(state.showNotesAction, true);
    assert.equal(state.watchedByCurrentUser, false);
    assert.equal(state.primaryActionLabel, "Mark watched");
    assert.equal(state.notesButtonLabel, "Add note");
    assert.equal(state.notesBadgeText, null);
  });

  await t.test("logged-in watched movie with notes", () => {
    const state = getMovieActionState({
      movie: createMovie({
        watchedBy: ["Aaron"],
      }),
      currentUser: "Aaron",
      memoriesCount: 2,
    });

    assert.equal(state.showActionRail, true);
    assert.equal(state.watchedByCurrentUser, true);
    assert.equal(state.primaryActionLabel, "Watched");
    assert.equal(state.notesButtonLabel, "2 notes");
    assert.equal(state.notesBadgeText, "2");
  });

  await t.test("guest with existing notes", () => {
    const state = getMovieActionState({
      movie: createMovie({
        watchedBy: ["Electra"],
      }),
      currentUser: null,
      memoriesCount: 1,
    });

    assert.equal(state.isGuest, true);
    assert.equal(state.showActionRail, true);
    assert.equal(state.showWatchedAction, false);
    assert.equal(state.showNotesAction, true);
    assert.equal(state.notesButtonLabel, "1 note");
    assert.equal(state.notesButtonAriaLabel, 'View notes for "Heat"');
  });

  await t.test("guest with no notes", () => {
    const state = getMovieActionState({
      movie: createMovie(),
      currentUser: null,
      memoriesCount: 0,
    });

    assert.equal(state.showActionRail, false);
    assert.equal(state.showWatchedAction, false);
    assert.equal(state.showNotesAction, false);
    assert.equal(state.notesButtonAriaLabel, null);
    assert.equal(state.primaryActionAriaLabel, null);
  });
});
