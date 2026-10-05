import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import {
  parseQuiz,
  parseMatchmaker,
  parsePins,
  parseSpinHistory,
  parseDailySpin,
  quizScopeDefinition,
  matchmakerScopeDefinition,
  pinsScopeDefinition,
  spinHistoryScopeDefinition,
  dailySpinScopeDefinition,
} from "./interactive.js";
import { defaultQuizData } from "../../../apps/web/src/services/state/stateSchemas.js";
import type { MutationContext } from "../state.js";
import type { MatchmakerGame } from "../../../apps/web/src/shared/types.js";

const mockContext: MutationContext = {
  currentUser: "Aaron",
  now: "2024-01-01T00:00:00Z",
};

describe("interactive state scope parsers and scope definitions", () => {
  describe("parseQuiz", () => {
    it("returns default quiz data when content is null or empty string", () => {
      assert.deepEqual(parseQuiz(null), defaultQuizData);
      assert.deepEqual(parseQuiz(""), defaultQuizData);
    });

    it("parses valid quiz JSON content correctly", () => {
      const validQuiz = {
        questions: [
          {
            id: "q1",
            question: "Sample Question?",
            options: ["A", "B"],
            answer: 0,
          },
        ],
      };
      const result = parseQuiz(JSON.stringify(validQuiz));
      assert.equal(result.questions.length, 1);
      assert.equal(result.questions[0].id, "q1");
    });

    it("catches JSON parsing error and falls back to default quiz data", () => {
      const consoleSpy = mock.method(console, "error", () => {});
      try {
        const result = parseQuiz("invalid json {");
        assert.deepEqual(result, defaultQuizData);
        assert.equal(consoleSpy.mock.calls.length, 1);
        assert.match(
          consoleSpy.mock.calls[0].arguments[0],
          /Failed to parse quiz\.json/
        );
      } finally {
        consoleSpy.mock.restore();
      }
    });
  });

  describe("parseMatchmaker", () => {
    it("returns null when content is null or empty string", () => {
      assert.equal(parseMatchmaker(null), null);
      assert.equal(parseMatchmaker(""), null);
    });

    it("parses valid matchmaker JSON content correctly", () => {
      const game = {
        id: "game-1",
        moviePool: ["m1", "m2"],
        aaronLikes: [],
        electraLikes: [],
        aaronDislikes: [],
        electraDislikes: [],
        aaronSwipeOrder: [],
        electraSwipeOrder: [],
        status: "active",
        createdAt: "2024-01-01T00:00:00Z",
        startedBy: "Aaron",
      };
      const result = parseMatchmaker(JSON.stringify(game));
      assert.notEqual(result, null);
      assert.equal(result?.id, "game-1");
    });

    it("catches JSON parsing error and falls back to null", () => {
      const consoleSpy = mock.method(console, "error", () => {});
      try {
        const result = parseMatchmaker("bad JSON }");
        assert.equal(result, null);
        assert.equal(consoleSpy.mock.calls.length, 1);
        assert.match(
          consoleSpy.mock.calls[0].arguments[0],
          /Failed to parse matchmaker\.json/
        );
      } finally {
        consoleSpy.mock.restore();
      }
    });
  });

  describe("parsePins", () => {
    it("returns empty object when content is null or empty string", () => {
      assert.deepEqual(parsePins(null), {});
      assert.deepEqual(parsePins(""), {});
    });

    it("parses valid pins JSON content correctly", () => {
      const pins = { Aaron: "1234hash" };
      const result = parsePins(JSON.stringify(pins));
      assert.deepEqual(result, { Aaron: "1234hash" });
    });

    it("catches JSON parsing error and falls back to empty object", () => {
      const consoleSpy = mock.method(console, "error", () => {});
      try {
        const result = parsePins("{ not json");
        assert.deepEqual(result, {});
        assert.equal(consoleSpy.mock.calls.length, 1);
        assert.match(
          consoleSpy.mock.calls[0].arguments[0],
          /Failed to parse pins\.json/
        );
      } finally {
        consoleSpy.mock.restore();
      }
    });
  });

  describe("parseSpinHistory", () => {
    it("returns empty array when content is null or empty string", () => {
      assert.deepEqual(parseSpinHistory(null), []);
      assert.deepEqual(parseSpinHistory(""), []);
    });

    it("parses valid spin history JSON content correctly", () => {
      const history = ["Movie A", "Movie B"];
      const result = parseSpinHistory(JSON.stringify(history));
      assert.deepEqual(result, ["Movie A", "Movie B"]);
    });

    it("catches JSON parsing error and falls back to empty array", () => {
      const consoleSpy = mock.method(console, "error", () => {});
      try {
        const result = parseSpinHistory("[invalid array");
        assert.deepEqual(result, []);
        assert.equal(consoleSpy.mock.calls.length, 1);
        assert.match(
          consoleSpy.mock.calls[0].arguments[0],
          /Failed to parse spinhistory\.json/
        );
      } finally {
        consoleSpy.mock.restore();
      }
    });
  });

  describe("parseDailySpin", () => {
    it("returns null when content is null or empty string", () => {
      assert.equal(parseDailySpin(null), null);
      assert.equal(parseDailySpin(""), null);
    });

    it("parses valid daily spin JSON content correctly", () => {
      const dailySpin = {
        date: "2024-01-01",
        spins: [
          {
            movieId: "m1",
            movieTitle: "Movie 1",
            spunBy: "Aaron",
            createdAt: "2024-01-01T00:00:00Z",
          },
        ],
      };
      const result = parseDailySpin(JSON.stringify(dailySpin));
      assert.notEqual(result, null);
      assert.equal(result?.date, "2024-01-01");
      assert.equal(result?.spins.length, 1);
    });

    it("catches JSON parsing error and falls back to null", () => {
      const consoleSpy = mock.method(console, "error", () => {});
      try {
        const result = parseDailySpin("invalid daily spin }");
        assert.equal(result, null);
        assert.equal(consoleSpy.mock.calls.length, 1);
        assert.match(
          consoleSpy.mock.calls[0].arguments[0],
          /Failed to parse dailyspin\.json/
        );
      } finally {
        consoleSpy.mock.restore();
      }
    });
  });

  describe("quizScopeDefinition", () => {
    it("handles mutate operations", () => {
      const result = quizScopeDefinition.mutate(
        defaultQuizData,
        "replace_quiz",
        { quizData: defaultQuizData },
        mockContext
      );
      assert.equal(result.ok, true);

      const invalidResult = quizScopeDefinition.mutate(
        defaultQuizData,
        "unknown_op",
        {},
        mockContext
      );
      assert.equal(invalidResult.ok, false);
    });

    it("serializes and converts to client data", () => {
      const json = quizScopeDefinition.serialize(defaultQuizData);
      assert.ok(json.length > 0);
      assert.deepEqual(quizScopeDefinition.toClient(defaultQuizData), defaultQuizData);
    });
  });

  describe("matchmakerScopeDefinition", () => {
    it("handles start_game, swipe, undo, and end_game mutations", () => {
      const startRes = matchmakerScopeDefinition.mutate(
        null,
        "start_game",
        { movieIds: ["m1", "m2"] },
        mockContext
      );
      assert.equal(startRes.ok, true);
      if (!startRes.ok) return;

      const game = startRes.data as MatchmakerGame;
      assert.equal(game.moviePool.length, 2);

      const swipeRes = matchmakerScopeDefinition.mutate(
        game,
        "swipe",
        { movieId: "m1", liked: true },
        mockContext
      );
      assert.equal(swipeRes.ok, true);

      const undoRes = matchmakerScopeDefinition.mutate(
        game,
        "undo",
        {},
        mockContext
      );
      assert.equal(undoRes.ok, true);

      const endRes = matchmakerScopeDefinition.mutate(
        game,
        "end_game",
        {},
        mockContext
      );
      assert.equal(endRes.ok, true);
      if (endRes.ok) {
        assert.equal(endRes.data, null);
      }
    });

    it("serializes and converts to client data", () => {
      assert.equal(matchmakerScopeDefinition.serialize(null), "");
      const game: MatchmakerGame = {
        id: "g1",
        moviePool: ["m1"],
        aaronLikes: [],
        electraLikes: [],
        aaronDislikes: [],
        electraDislikes: [],
        aaronSwipeOrder: [],
        electraSwipeOrder: [],
        status: "active",
        createdAt: "2024-01-01T00:00:00Z",
        startedBy: "Aaron",
      };
      assert.ok(matchmakerScopeDefinition.serialize(game).length > 0);
      assert.deepEqual(matchmakerScopeDefinition.toClient(game), game);
    });
  });

  describe("pinsScopeDefinition", () => {
    it("handles set_pin and remove_pin mutations", () => {
      const setRes = pinsScopeDefinition.mutate(
        {},
        "set_pin",
        { pin: "1234" },
        mockContext
      );
      assert.equal(setRes.ok, true);

      const removeRes = pinsScopeDefinition.mutate(
        { Aaron: "hash" },
        "remove_pin",
        {},
        mockContext
      );
      assert.equal(removeRes.ok, true);
      if (removeRes.ok) {
        assert.equal((removeRes.data as Record<string, string | undefined>).Aaron, undefined);
      }
    });

    it("serializes and converts to client data format", () => {
      const pins = { Aaron: "hash123", Electra: "" };
      const serialized = pinsScopeDefinition.serialize(pins);
      assert.ok(serialized.includes("Aaron"));

      const clientData = pinsScopeDefinition.toClient(pins);
      assert.deepEqual(clientData, { Aaron: true, Electra: false });
    });
  });

  describe("spinHistoryScopeDefinition", () => {
    it("handles record_pick mutation", () => {
      const res = spinHistoryScopeDefinition.mutate(
        [],
        "record_pick",
        { title: "Inception" },
        mockContext
      );
      assert.equal(res.ok, true);
      if (res.ok) {
        assert.deepEqual(res.data, ["Inception"]);
      }
    });

    it("serializes and converts to client data", () => {
      const history = ["Inception"];
      assert.ok(spinHistoryScopeDefinition.serialize(history).includes("Inception"));
      assert.deepEqual(spinHistoryScopeDefinition.toClient(history), history);
    });
  });

  describe("dailySpinScopeDefinition", () => {
    it("handles record_daily mutation", () => {
      const res = dailySpinScopeDefinition.mutate(
        null,
        "record_daily",
        { movieId: "m1", movieTitle: "Inception" },
        mockContext
      );
      assert.equal(res.ok, true);
    });

    it("serializes and converts to client data", () => {
      assert.equal(dailySpinScopeDefinition.serialize(null), "");
      const record = {
        date: "2024-01-01",
        spins: [
          {
            movieId: "m1",
            movieTitle: "Inception",
            spunBy: "Aaron" as const,
            createdAt: "2024-01-01T00:00:00Z",
          },
        ],
      };
      assert.ok(dailySpinScopeDefinition.serialize(record).includes("Inception"));
      assert.deepEqual(dailySpinScopeDefinition.toClient(record), record);
    });
  });
});
