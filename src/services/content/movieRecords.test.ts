import test from "node:test";
import assert from "node:assert/strict";
import {
  cloneMovies,
  isMovieRecord,
  normalizeMovieRecord,
  normalizeMovies,
} from "./movieRecords.ts";
import type { Movie } from "../../shared/types.ts";

test("cloneMovies", async (t) => {
  await t.test(
    "returns a new array with cloned movies and watchedBy arrays",
    () => {
      const original = [
        {
          id: "1",
          title: "Test",
          addedBy: "Aaron",
          watchedBy: ["Electra"],
          createdAt: "2026-03-21T12:00:00.000Z",
        },
      ] as Movie[];
      const cloned = cloneMovies(original);
      assert.deepEqual(cloned, original);
      assert.notEqual(cloned, original);
      assert.notEqual(cloned[0], original[0]);
      assert.notEqual(cloned[0].watchedBy, original[0].watchedBy);
    },
  );
});

test("normalizeMovieRecord", async (t) => {
  const validMovie = {
    id: "1",
    title: "Test Movie",
    addedBy: "Aaron",
    createdAt: "2026-03-21T12:00:00.000Z",
    watchedBy: [],
  };

  await t.test("accepts valid movie", () => {
    const m = normalizeMovieRecord(validMovie);
    assert.equal(m?.id, validMovie.id);
    assert.equal(m?.title, validMovie.title);
  });

  await t.test("rejects missing or invalid required fields", () => {
    assert.equal(normalizeMovieRecord(null), null);
    assert.equal(normalizeMovieRecord({ ...validMovie, id: undefined }), null);
    assert.equal(
      normalizeMovieRecord({ ...validMovie, title: undefined }),
      null,
    );
    assert.equal(
      normalizeMovieRecord({ ...validMovie, addedBy: "InvalidUser" }),
      null,
    );
    assert.equal(
      normalizeMovieRecord({ ...validMovie, createdAt: "not-a-date" }),
      null,
    );
  });

  await t.test("normalizes posterUrl", () => {
    const m1 = normalizeMovieRecord({
      ...validMovie,
      posterUrl: "https://example.com/poster.jpg",
    });
    assert.equal(m1?.posterUrl, "https://example.com/poster.jpg");

    const m2 = normalizeMovieRecord({
      ...validMovie,
      posterUrl: "http://example.com/poster.jpg",
    });
    assert.equal(m2?.posterUrl, "https://example.com/poster.jpg");

    const m3 = normalizeMovieRecord({
      ...validMovie,
      posterUrl: "invalid-url",
    });
    assert.equal(m3?.posterUrl, undefined);
  });

  await t.test(
    "handles URL parsing error in normalizePosterUrl catch block",
    () => {
      const OriginalURL = global.URL;
      try {
        let callCount = 0;
        global.URL = class extends OriginalURL {
          constructor(input: string | URL, base?: string | URL) {
            if (input === "https://error.com/") {
              callCount++;
              if (callCount === 2) {
                throw new TypeError("Mock Error");
              }
            }
            super(input, base);
          }
        } as typeof URL;

        const m = normalizeMovieRecord({
          ...validMovie,
          posterUrl: "https://error.com/",
        });
        assert.equal(m?.posterUrl, undefined);
        assert.equal(callCount, 2);
      } finally {
        global.URL = OriginalURL;
      }
    },
  );

  await t.test(
    "normalizes watchedBy by filtering and deduplicating users",
    () => {
      const m = normalizeMovieRecord({
        ...validMovie,
        watchedBy: ["Aaron", "InvalidUser", "Aaron", "Electra"],
      });
      assert.deepEqual(m?.watchedBy, ["Aaron", "Electra"]);
    },
  );

  await t.test("returns undefined for posterUrl if not a string", () => {
    const m = normalizeMovieRecord({ ...validMovie, posterUrl: 123 });
    assert.equal(m?.posterUrl, undefined);
  });

  await t.test("returns null for movie record if id is not a string", () => {
    assert.equal(normalizeMovieRecord({ ...validMovie, id: 123 }), null);
  });

  await t.test("returns null for movie record if title is not a string", () => {
    assert.equal(normalizeMovieRecord({ ...validMovie, title: 123 }), null);
  });

  await t.test(
    "returns null for movie record if createdAt is not a string",
    () => {
      assert.equal(
        normalizeMovieRecord({ ...validMovie, createdAt: 123 }),
        null,
      );
    },
  );

  await t.test(
    "returns undefined for optional string fields if not a string",
    () => {
      const m = normalizeMovieRecord({ ...validMovie, plot: 123 });
      assert.equal(m?.plot, undefined);
    },
  );
});

test("isMovieRecord", async (t) => {
  await t.test("returns true for valid movie records", () => {
    assert.equal(
      isMovieRecord({
        id: "1",
        title: "Test",
        addedBy: "Aaron",
        createdAt: "2026-03-21T12:00:00.000Z",
      }),
      true,
    );
  });

  await t.test("returns false for invalid movie records", () => {
    assert.equal(isMovieRecord(null), false);
    assert.equal(isMovieRecord({}), false);
  });
});

test("normalizeMovies", async (t) => {
  await t.test("returns array of valid movies", () => {
    const valid = {
      id: "1",
      title: "Test",
      addedBy: "Aaron",
      createdAt: "2026-03-21T12:00:00.000Z",
    };
    const invalid = { id: "2" };

    const result = normalizeMovies([valid, invalid]);
    assert.equal(result.length, 1);
    assert.equal(result[0].id, valid.id);
  });

  await t.test("returns empty array for non-array input", () => {
    assert.deepEqual(normalizeMovies(null), []);
  });
});
