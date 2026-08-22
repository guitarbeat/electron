import assert from "node:assert/strict";
import test from "node:test";

import { buildProfileCookie } from "../../../../api/_lib/session.ts";
import { installSharedStateMemoryStoreForTests } from "../../../../api/_lib/sharedStateStore.ts";
import mutateHandler from "../../../../api/state/[scope]/mutate.ts";
import readHandler from "../../../../api/state/[scope].ts";
import type { Movie } from "../shared/types.ts";

test("production movie API creates a metadata-aware deduplicated batch", async () => {
  const store = installSharedStateMemoryStoreForTests({
    "movielist.json": JSON.stringify([
      {
        id: "existing",
        title: "Tiger King",
        addedBy: "Electra",
        watchedBy: [],
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ] satisfies Movie[]),
  });

  try {
    const cookie = buildProfileCookie(
      new Request("https://example.com/api/session/profile"),
      "Aaron",
    );
    const readResponse = await readHandler(
      new Request("https://example.com/api/state/movies", { headers: { cookie } }),
    );
    const { version } = (await readResponse.json()) as { version: string };

    const response = await mutateHandler(
      new Request("https://example.com/api/state/movies/mutate", {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie },
        body: JSON.stringify({
          baseVersion: version,
          op: "add_movies",
          payload: {
            items: [
              { title: "tiger king" },
              {
                title: "The Tatami Galaxy",
                metadata: { mediaType: "series", year: "2010" },
              },
            ],
          },
        }),
      }),
    );

    assert.equal(response.status, 200);
    const payload = (await response.json()) as { data: Movie[] };
    assert.deepEqual(payload.data.map((movie) => movie.title), [
      "Tiger King",
      "The Tatami Galaxy",
    ]);
    assert.equal(payload.data[1]?.mediaType, "series");
    assert.equal(payload.data[1]?.category, "TV Series");
    assert.equal(payload.data[1]?.year, "2010");
  } finally {
    store.dispose();
  }
});
