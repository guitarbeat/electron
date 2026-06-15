import assert from "node:assert/strict";
import test from "node:test";
import {
  appendDailySpinEntry,
  normalizeDailySpinRecord,
  normalizeSpinHistoryParsed,
} from "../services/state/stateSchemas.ts";

test("normalizeSpinHistoryParsed accepts string titles", () => {
  assert.deepEqual(normalizeSpinHistoryParsed(["A", "B"]), ["A", "B"]);
});

test("normalizeSpinHistoryParsed maps legacy objects", () => {
  assert.deepEqual(
    normalizeSpinHistoryParsed([{ title: "X" }, { movieTitle: "Y" }]),
    ["X", "Y"],
  );
});

test("normalizeSpinHistoryParsed drops invalid entries", () => {
  assert.deepEqual(normalizeSpinHistoryParsed([{}, "ok", 3]), ["ok"]);
});

test("normalizeDailySpinRecord accepts canonical daily record", () => {
  const r = normalizeDailySpinRecord({
    date: "2026-03-22",
    spins: [
      {
        movieId: "m1",
        movieTitle: "Test",
        spunBy: "Aaron",
        createdAt: "2026-03-22T12:00:00.000Z",
      },
    ],
  });
  assert.ok(r);
  assert.equal(r?.spins[0]?.movieTitle, "Test");
  assert.equal(r?.spins[0]?.spunBy, "Aaron");
});

test("normalizeDailySpinRecord upgrades legacy single-spin records", () => {
  const r = normalizeDailySpinRecord({
    date: "2026-03-22",
    movieId: "m1",
    movieTitle: "Legacy Test",
    spunBy: "Aaron",
    createdAt: "2026-03-22T12:00:00.000Z",
  });

  assert.deepEqual(r, {
    date: "2026-03-22",
    spins: [
      {
        movieId: "m1",
        movieTitle: "Legacy Test",
        spunBy: "Aaron",
        createdAt: "2026-03-22T12:00:00.000Z",
      },
    ],
  });
});

test("normalizeDailySpinRecord rejects bad spunBy", () => {
  assert.equal(
    normalizeDailySpinRecord({
      date: "2026-03-22",
      movieId: "m1",
      movieTitle: "Test",
      spunBy: "Guest",
      createdAt: "2026-03-22T12:00:00.000Z",
    }),
    null,
  );
});

test("appendDailySpinEntry appends spins on the same UTC day", () => {
  const next = appendDailySpinEntry(
    {
      date: "2026-03-22",
      spins: [
        {
          movieId: "m1",
          movieTitle: "First",
          spunBy: "Aaron",
          createdAt: "2026-03-22T12:00:00.000Z",
        },
      ],
    },
    {
      movieId: "m2",
      movieTitle: "Second",
      spunBy: "Electra",
      createdAt: "2026-03-22T18:30:00.000Z",
    },
  );

  assert.equal(next.date, "2026-03-22");
  assert.deepEqual(
    next.spins.map((entry) => entry.movieTitle),
    ["First", "Second"],
  );
});

test("appendDailySpinEntry resets when the UTC day changes", () => {
  const next = appendDailySpinEntry(
    {
      date: "2026-03-22",
      spins: [
        {
          movieId: "m1",
          movieTitle: "First",
          spunBy: "Aaron",
          createdAt: "2026-03-22T12:00:00.000Z",
        },
      ],
    },
    {
      movieId: "m2",
      movieTitle: "Fresh Day",
      spunBy: "Electra",
      createdAt: "2026-03-23T00:01:00.000Z",
    },
  );

  assert.deepEqual(next, {
    date: "2026-03-23",
    spins: [
      {
        movieId: "m2",
        movieTitle: "Fresh Day",
        spunBy: "Electra",
        createdAt: "2026-03-23T00:01:00.000Z",
      },
    ],
  });
});
