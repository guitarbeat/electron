import assert from "node:assert/strict";
import test from "node:test";

import { getScopeWarning } from "../../api/_lib/state.ts";
import { invalidateSharedStateCache } from "../../api/_lib/sharedStateStore.ts";
import { buildProfileCookie } from "../../api/_lib/session.ts";
import { createSharedStateMemoryMock } from "./test/sharedStateMock.ts";
import mutateHandler from "../../api/state/[scope]/mutate.ts";
import readHandler from "../../api/state/[scope].ts";
import type {
  Movie,
  MovieSuggestion,
  PlaceSuggestion,
  SharedMemory,
} from "../shared/types.ts";

const withUnsetDatabase = async (run: () => Promise<void>) => {
  const previousUrl = process.env.DATABASE_URL;
  const previousPostgresUrl = process.env.POSTGRES_URL;
  const previousViteUrl = process.env.VITE_DATABASE_URL;
  delete process.env.DATABASE_URL;
  delete process.env.POSTGRES_URL;
  delete process.env.VITE_DATABASE_URL;
  invalidateSharedStateCache();

  try {
    await run();
  } finally {
    if (typeof previousUrl === "string") {
      process.env.DATABASE_URL = previousUrl;
    } else {
      delete process.env.DATABASE_URL;
    }
    if (typeof previousPostgresUrl === "string") {
      process.env.POSTGRES_URL = previousPostgresUrl;
    } else {
      delete process.env.POSTGRES_URL;
    }
    if (typeof previousViteUrl === "string") {
      process.env.VITE_DATABASE_URL = previousViteUrl;
    } else {
      delete process.env.VITE_DATABASE_URL;
    }
    invalidateSharedStateCache();
  }
};

const withMovieStore = async (
  seedMovies: Movie[],
  run: (context: {
    getMovies: () => Movie[];
    patchBodies: unknown[];
  }) => Promise<void>,
) => {
  const mock = createSharedStateMemoryMock({
    "movielist.json": JSON.stringify(seedMovies),
  });

  try {
    await run({
      getMovies: () =>
        JSON.parse(mock.getFile("movielist.json") ?? "[]") as Movie[],
      patchBodies: mock.patchBodies,
    });
  } finally {
    mock.dispose();
  }
};

const withSuggestionStore = async (
  seedSuggestions: MovieSuggestion[],
  run: (context: {
    getSuggestions: () => MovieSuggestion[];
    patchBodies: unknown[];
  }) => Promise<void>,
) => {
  const mock = createSharedStateMemoryMock({
    "suggestions.json": JSON.stringify(seedSuggestions),
  });

  try {
    await run({
      getSuggestions: () =>
        JSON.parse(
          mock.getFile("suggestions.json") ?? "[]",
        ) as MovieSuggestion[],
      patchBodies: mock.patchBodies,
    });
  } finally {
    mock.dispose();
  }
};

const withPlaceSuggestionStore = async (
  seedSuggestions: PlaceSuggestion[],
  run: (context: {
    getSuggestions: () => PlaceSuggestion[];
    patchBodies: unknown[];
  }) => Promise<void>,
) => {
  const mock = createSharedStateMemoryMock({
    "placesuggestions.json": JSON.stringify(seedSuggestions),
  });

  try {
    await run({
      getSuggestions: () =>
        JSON.parse(
          mock.getFile("placesuggestions.json") ?? "[]",
        ) as PlaceSuggestion[],
      patchBodies: mock.patchBodies,
    });
  } finally {
    mock.dispose();
  }
};

const withMemoryStore = async (
  seedMemories: SharedMemory[],
  run: (context: {
    getMemories: () => SharedMemory[];
    patchBodies: unknown[];
  }) => Promise<void>,
) => {
  const mock = createSharedStateMemoryMock({
    "memories.json": JSON.stringify(seedMemories),
  });

  try {
    await run({
      getMemories: () =>
        JSON.parse(mock.getFile("memories.json") ?? "[]") as SharedMemory[],
      patchBodies: mock.patchBodies,
    });
  } finally {
    mock.dispose();
  }
};

test("dynamic state read route returns 404 for unknown scopes", async () => {
  const response = await readHandler(
    new Request("https://example.com/api/state/nope"),
  );

  assert.equal(response.status, 404);
  assert.match(await response.text(), /not found/i);
});

test("dynamic state mutate route returns 404 for unknown scopes", async () => {
  const response = await mutateHandler(
    new Request("https://example.com/api/state/nope/mutate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    }),
  );

  assert.equal(response.status, 404);
  assert.match(await response.text(), /not found/i);
});

test("getScopeWarning maps shared-store and config errors to user-safe copy", () => {
  assert.ok(
    (
      getScopeWarning(new Error("DATABASE_URL is not configured.")) ?? ""
    ).includes("DATABASE_URL"),
  );
  assert.ok(
    (
      getScopeWarning(new Error("Failed to read shared state (404).")) ?? ""
    ).includes("404"),
  );
  assert.ok(
    (
      getScopeWarning(new Error("Failed to read shared state (403).")) ?? ""
    ).includes("401/403"),
  );
  assert.ok(
    (
      getScopeWarning(new Error("Failed to read shared state (429).")) ?? ""
    ).includes("rate limit"),
  );
  assert.ok(
    (
      getScopeWarning(new Error("Failed to update shared state (500).")) ?? ""
    ).includes("500"),
  );
  assert.ok(
    (getScopeWarning(new Error("unexpected")) ?? "").includes(
      "could not be loaded",
    ),
  );
  assert.equal(getScopeWarning(null), undefined);
});

test("dynamic state read route falls back to default state when DATABASE_URL is missing", async () => {
  await withUnsetDatabase(async () => {
    const originalWarn = console.warn;
    console.warn = () => {};

    try {
      const response = await readHandler(
        new Request("https://example.com/api/state/movies"),
      );
      const payload = (await response.json()) as {
        data: Movie[];
        degraded: boolean;
        warning?: string;
      };

      assert.equal(response.status, 200);
      assert.equal(payload.degraded, true);
      assert.ok(Array.isArray(payload.data) && payload.data.length > 0);
      assert.match(payload.warning ?? "", /DATABASE_URL|VITE_DATABASE/i);
    } finally {
      console.warn = originalWarn;
    }
  });
});

test("dynamic state mutate route renames a movie when a profile session is present", async () => {
  await withMovieStore(
    [
      {
        id: "movie-1",
        title: "Before",
        addedBy: "Aaron",
        watchedBy: [],
        createdAt: new Date("2026-03-27T12:00:00.000Z").toISOString(),
      },
    ],
    async ({ getMovies, patchBodies }) => {
      const cookie = buildProfileCookie(
        new Request("https://example.com/api/session/profile"),
        "Aaron",
      );

      const readResponse = await readHandler(
        new Request("https://example.com/api/state/movies", {
          headers: {
            cookie,
          },
        }),
      );

      assert.equal(readResponse.status, 200);

      const readPayload = (await readResponse.json()) as {
        version: string;
      };

      const response = await mutateHandler(
        new Request("https://example.com/api/state/movies/mutate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            cookie,
          },
          body: JSON.stringify({
            baseVersion: readPayload.version,
            op: "rename_movie",
            payload: {
              movieId: "movie-1",
              title: "After Hours",
            },
          }),
        }),
      );

      assert.equal(response.status, 200);

      const payload = (await response.json()) as {
        data: Movie[];
        applied: boolean;
      };

      assert.equal(payload.applied, true);
      assert.equal(payload.data[0]?.title, "After Hours");
      assert.equal(getMovies()[0]?.title, "After Hours");
      assert.equal(patchBodies.length, 1);
    },
  );
});

test("dynamic state mutate route lets guests create movie suggestions", async () => {
  await withSuggestionStore([], async ({ getSuggestions, patchBodies }) => {
    const readResponse = await readHandler(
      new Request("https://example.com/api/state/suggestions"),
    );
    assert.equal(readResponse.status, 200);

    const readPayload = (await readResponse.json()) as {
      version: string;
    };

    const response = await mutateHandler(
      new Request("https://example.com/api/state/suggestions/mutate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          baseVersion: readPayload.version,
          op: "add_suggestion",
          payload: {
            id: "suggestion-1",
            title: "The Nice Guys",
            reason: "Sharp, funny, and easy to throw on.",
            suggestedBy: "Movie Night Guest",
            imdbID: "tt3799694",
            type: "movie",
          },
        }),
      }),
    );

    assert.equal(response.status, 200);

    const payload = (await response.json()) as {
      data: MovieSuggestion[];
      applied: boolean;
    };

    assert.equal(payload.applied, true);
    assert.equal(payload.data[0]?.title, "The Nice Guys");
    assert.equal(payload.data[0]?.suggestedBy, "Movie Night Guest");
    assert.equal(payload.data[0]?.imdbID, "tt3799694");
    assert.equal(payload.data[0]?.type, "movie");
    assert.equal(getSuggestions()[0]?.suggestedBy, "Movie Night Guest");
    assert.equal(getSuggestions()[0]?.imdbID, "tt3799694");
    assert.equal(getSuggestions()[0]?.type, "movie");
    assert.equal(patchBodies.length, 1);
  });
});

test("dynamic state mutate route lets guests create place suggestions", async () => {
  await withPlaceSuggestionStore(
    [],
    async ({ getSuggestions, patchBodies }) => {
      const readResponse = await readHandler(
        new Request("https://example.com/api/state/placeSuggestions"),
      );
      assert.equal(readResponse.status, 200);

      const readPayload = (await readResponse.json()) as {
        version: string;
      };

      const response = await mutateHandler(
        new Request("https://example.com/api/state/placeSuggestions/mutate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            baseVersion: readPayload.version,
            op: "add_place_suggestion",
            payload: {
              id: "place-suggestion-1",
              name: "Skylight Lounge",
              notes: "Rooftop patio and late-night tacos.",
              category: "Restaurant",
              suggestedBy: "Patio Scout",
            },
          }),
        }),
      );

      assert.equal(response.status, 200);

      const payload = (await response.json()) as {
        data: PlaceSuggestion[];
        applied: boolean;
      };

      assert.equal(payload.applied, true);
      assert.equal(payload.data[0]?.name, "Skylight Lounge");
      assert.equal(
        payload.data[0]?.notes,
        "Rooftop patio and late-night tacos.",
      );
      assert.equal(payload.data[0]?.category, "Restaurant");
      assert.equal(payload.data[0]?.suggestedBy, "Patio Scout");
      assert.equal(getSuggestions()[0]?.suggestedBy, "Patio Scout");
      assert.equal(patchBodies.length, 1);
    },
  );
});

test("dynamic state mutate route keeps selection metadata for signed-in suggestions", async () => {
  await withSuggestionStore([], async ({ getSuggestions, patchBodies }) => {
    const cookie = buildProfileCookie(
      new Request("https://example.com/api/session/profile"),
      "Aaron",
    );

    const readResponse = await readHandler(
      new Request("https://example.com/api/state/suggestions", {
        headers: {
          cookie,
        },
      }),
    );
    assert.equal(readResponse.status, 200);

    const readPayload = (await readResponse.json()) as {
      version: string;
    };

    const response = await mutateHandler(
      new Request("https://example.com/api/state/suggestions/mutate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie,
        },
        body: JSON.stringify({
          baseVersion: readPayload.version,
          op: "add_suggestion",
          payload: {
            id: "suggestion-2",
            title: "The Bear",
            reason: "Series pick",
            imdbID: "tv-11",
            type: "series",
          },
        }),
      }),
    );

    assert.equal(response.status, 200);

    const payload = (await response.json()) as {
      data: MovieSuggestion[];
      applied: boolean;
    };

    assert.equal(payload.applied, true);
    assert.equal(payload.data[0]?.suggestedBy, "Aaron");
    assert.equal(payload.data[0]?.imdbID, "tv-11");
    assert.equal(payload.data[0]?.type, "series");
    assert.equal(getSuggestions()[0]?.imdbID, "tv-11");
    assert.equal(getSuggestions()[0]?.type, "series");
    assert.equal(patchBodies.length, 1);
  });
});

test("dynamic state mutate route rejects editing another user memory", async () => {
  await withMemoryStore(
    [
      {
        id: "memory-1",
        movieId: "movie-1",
        movieTitle: "Moonlight",
        author: "Aaron",
        note: "Original note",
        createdAt: new Date("2026-03-27T12:00:00.000Z").toISOString(),
      },
    ],
    async ({ getMemories, patchBodies }) => {
      const cookie = buildProfileCookie(
        new Request("https://example.com/api/session/profile"),
        "Electra",
      );

      const readResponse = await readHandler(
        new Request("https://example.com/api/state/memories", {
          headers: {
            cookie,
          },
        }),
      );
      assert.equal(readResponse.status, 200);

      const readPayload = (await readResponse.json()) as { version: string };

      const response = await mutateHandler(
        new Request("https://example.com/api/state/memories/mutate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            cookie,
          },
          body: JSON.stringify({
            baseVersion: readPayload.version,
            op: "update_memory",
            payload: {
              memoryId: "memory-1",
              updates: {
                note: "Rewritten by someone else",
              },
            },
          }),
        }),
      );

      assert.equal(response.status, 409);
      const payload = (await response.json()) as { conflict: string };
      assert.match(payload.conflict, /only the author can edit/i);
      assert.equal(getMemories()[0]?.note, "Original note");
      assert.equal(patchBodies.length, 0);
    },
  );
});

test("dynamic state mutate route rejects deleting another user memory", async () => {
  await withMemoryStore(
    [
      {
        id: "memory-1",
        movieId: "movie-1",
        movieTitle: "Moonlight",
        author: "Aaron",
        note: "Original note",
        createdAt: new Date("2026-03-27T12:00:00.000Z").toISOString(),
      },
    ],
    async ({ getMemories, patchBodies }) => {
      const cookie = buildProfileCookie(
        new Request("https://example.com/api/session/profile"),
        "Electra",
      );

      const readResponse = await readHandler(
        new Request("https://example.com/api/state/memories", {
          headers: {
            cookie,
          },
        }),
      );
      assert.equal(readResponse.status, 200);

      const readPayload = (await readResponse.json()) as { version: string };

      const response = await mutateHandler(
        new Request("https://example.com/api/state/memories/mutate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            cookie,
          },
          body: JSON.stringify({
            baseVersion: readPayload.version,
            op: "delete_memory",
            payload: {
              memoryId: "memory-1",
            },
          }),
        }),
      );

      assert.equal(response.status, 409);
      const payload = (await response.json()) as { conflict: string };
      assert.match(payload.conflict, /only the author can delete/i);
      assert.equal(getMemories().length, 1);
      assert.equal(patchBodies.length, 0);
    },
  );
});
