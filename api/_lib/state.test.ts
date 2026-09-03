import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { STATE_SCOPES } from "../../apps/web/src/services/state/stateTypes.js";
import {
  bootstrapMissingScopeFiles,
  getScopeDefinition,
  readScopeStoredData,
} from "./state.js";
import * as sharedStateStore from "./sharedStateStore.js";

describe("bootstrapMissingScopeFiles", () => {
  it("throws an error if DATABASE_URL is not configured and memory store is not installed", async () => {
    const originalDbUrl = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    sharedStateStore.invalidateSharedStateCache();

    try {
      await assert.rejects(
        async () => {
          await bootstrapMissingScopeFiles();
        },
        {
          name: "Error",
          message: "DATABASE_URL is not configured.",
        },
      );
    } finally {
      if (originalDbUrl !== undefined) {
        process.env.DATABASE_URL = originalDbUrl;
      }
      sharedStateStore.invalidateSharedStateCache();
    }
  });

  it("bootstraps missing scope files into memory store and returns state scope diagnostics", async () => {
    // Intentionally create a store with no files present
    const store = sharedStateStore.installSharedStateMemoryStoreForTests({});

    try {
      const diagnostics = await bootstrapMissingScopeFiles();

      // Expected scopes should match all defined state scopes
      assert.deepStrictEqual(diagnostics.expectedScopes, [...STATE_SCOPES]);

      // Since all scopes were missing and patched, missingScopes should now be empty
      assert.deepStrictEqual(diagnostics.missingScopes, []);

      // Verify each scope file was created in the memory store
      for (const scope of STATE_SCOPES) {
        const filename = getScopeDefinition(scope).filename;
        const fileContent = store.getFile(filename);
        assert.ok(
          fileContent !== undefined,
          `File for scope ${scope} (${filename}) should be created`,
        );
      }
    } finally {
      store.dispose();
    }
  });

  it("handles partially existing files during bootstrap without overwriting existing files", async () => {
    const moviesFilename = getScopeDefinition("movies").filename;
    const initialMovieContent = JSON.stringify([
      {
        id: "m-existing",
        title: "Existing Movie",
        addedBy: "Aaron",
        watchedBy: [],
        createdAt: "2024-01-01T00:00:00Z",
      },
    ]);

    const store = sharedStateStore.installSharedStateMemoryStoreForTests({
      [moviesFilename]: initialMovieContent,
    });

    try {
      const diagnostics = await bootstrapMissingScopeFiles();

      assert.deepStrictEqual(diagnostics.missingScopes, []);

      // Existing movie content should remain untouched
      const movieContent = store.getFile(moviesFilename);
      assert.strictEqual(movieContent, initialMovieContent);

      // Verify readScopeStoredData returns the existing data
      const movieData = await readScopeStoredData("movies");
      assert.strictEqual(movieData.fileMissing, false);
    } finally {
      store.dispose();
    }
  });
});
