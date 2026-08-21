import assert from "node:assert/strict";
import test from "node:test";
import type { MatchmakerGame, Movie } from "../../shared/types.ts";
import {
  SHORT_AND_SWEET_VIBE,
  applyMatchmakerSwipe,
  createMatchmakerPool,
  filterMoviesByVibe,
  getAvailableMatchmakerVibes,
  getMatchIds,
  getUserSwipedIds,
  isMatchmakerComplete,
  parseRuntimeMinutes,
  selectRandomMatch,
  undoMatchmakerSwipe,
} from "./matchmakerGame.ts";

const movies: Movie[] = [
  {
    id: "m-1",
    title: "Quick Laugh",
    addedBy: "Aaron",
    watchedBy: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    runtime: "95 min",
    genre: "Comedy, Romance",
    category: "Comfort",
  },
  {
    id: "m-2",
    title: "Long Night",
    addedBy: "Electra",
    watchedBy: [],
    createdAt: "2026-01-02T00:00:00.000Z",
    runtime: "1h 45m",
    genre: "Thriller",
    category: "Tense",
  },
  {
    id: "m-3",
    title: "Another Laugh",
    addedBy: "Aaron",
    watchedBy: [],
    createdAt: "2026-01-03T00:00:00.000Z",
    runtime: "88",
    genre: "Comedy",
  },
];

const baseGame: MatchmakerGame = {
  id: "game-1",
  moviePool: ["m-1", "m-2"],
  aaronLikes: [],
  electraLikes: [],
  aaronDislikes: [],
  electraDislikes: [],
  status: "active",
  createdAt: "2026-01-01T00:00:00.000Z",
  startedBy: "Aaron",
};

test("parseRuntimeMinutes", async (t) => {
  await t.test("parses plain minutes and hour-minute strings", () => {
    assert.equal(parseRuntimeMinutes("95 min"), 95);
    assert.equal(parseRuntimeMinutes("1h 45m"), 105);
    assert.equal(parseRuntimeMinutes("88"), 88);
  });
});

test("filterMoviesByVibe", async (t) => {
  await t.test("filters by Short & Sweet using parsed runtime", () => {
    const filtered = filterMoviesByVibe(movies, SHORT_AND_SWEET_VIBE);

    assert.deepEqual(
      filtered.map((movie) => movie.id),
      ["m-1", "m-3"],
    );
  });

  await t.test("filters by genre and category tags", () => {
    const filtered = filterMoviesByVibe(movies, "comfort");

    assert.deepEqual(
      filtered.map((movie) => movie.id),
      ["m-1"],
    );
  });
});

test("getAvailableMatchmakerVibes", async (t) => {
  await t.test("returns the most common tags in descending order", () => {
    const vibes = getAvailableMatchmakerVibes(movies, 3);

    assert.deepEqual(vibes, ["Comedy", "Comfort", "Romance"]);
  });
});

test("createMatchmakerPool", async (t) => {
  await t.test("creates a deterministic pool from the filtered movies", (t) => {
    t.mock.method(Math, "random", () => 0.5);
    const pool = createMatchmakerPool(movies, "Comedy");

    assert.deepEqual(pool.sort(), ["m-1", "m-3"].sort());
  });
});

test("matchmaker swipe helpers", async (t) => {
  await t.test("records a swipe once for the correct user", () => {
    const updated = applyMatchmakerSwipe(baseGame, "Aaron", "m-1", true);

    assert.deepEqual(updated.aaronLikes, ["m-1"]);
    assert.deepEqual(updated.aaronDislikes, []);
  });

  await t.test(
    "marks the game completed once both users finish the pool",
    () => {
      const afterAaron = applyMatchmakerSwipe(baseGame, "Aaron", "m-1", true);
      const afterAaron2 = applyMatchmakerSwipe(
        afterAaron,
        "Aaron",
        "m-2",
        false,
      );
      const afterElectra = applyMatchmakerSwipe(
        afterAaron2,
        "Electra",
        "m-1",
        true,
      );
      const completed = applyMatchmakerSwipe(
        afterElectra,
        "Electra",
        "m-2",
        true,
      );

      assert.equal(isMatchmakerComplete(completed), true);
      assert.equal(completed.status, "completed");
      assert.deepEqual(getMatchIds(completed), ["m-1"]);
    },
  );

  await t.test(
    "undoes the last swipe in movie-pool order and reopens the game",
    () => {
      const completedGame: MatchmakerGame = {
        ...baseGame,
        aaronLikes: ["m-1"],
        aaronDislikes: ["m-2"],
        electraLikes: ["m-1", "m-2"],
        status: "completed",
      };

      const undone = undoMatchmakerSwipe(completedGame, "Electra");

      assert.deepEqual(undone.electraLikes, ["m-1"]);
      assert.equal(undone.status, "active");
    },
  );
});

test("getUserSwipedIds", async (t) => {
  await t.test("returns likes and dislikes for the selected user", () => {
    const game: MatchmakerGame = {
      ...baseGame,
      aaronLikes: ["m-1"],
      aaronDislikes: ["m-2"],
    };

    assert.deepEqual(getUserSwipedIds(game, "Aaron"), ["m-1", "m-2"]);
  });
});

test("selectRandomMatch", async (t) => {
  await t.test("returns a deterministic match or null", () => {
    assert.equal(
      selectRandomMatch(["a", "b", "c"], () => 0.34),
      "b",
    );
    assert.equal(
      selectRandomMatch([], () => 0),
      null,
    );
  });
});
