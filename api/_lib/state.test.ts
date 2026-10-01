import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { STATE_SCOPES } from "../../apps/web/src/services/state/stateTypes.js";
import {
  bootstrapMissingScopeFiles,
  getScopeDefinition,
  getScopeWarning,
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

describe("getScopeWarning", () => {
  it("returns undefined if error is not an Error instance", () => {
    assert.strictEqual(getScopeWarning(null), undefined);
    assert.strictEqual(getScopeWarning("some error string"), undefined);
    assert.strictEqual(getScopeWarning(123), undefined);
    assert.strictEqual(getScopeWarning({ message: "error" }), undefined);
  });

  it("handles missing DATABASE_URL message", () => {
    const err = new Error("DATABASE_URL is not configured.");
    assert.strictEqual(
      getScopeWarning(err),
      "Shared sync is unavailable because the server is missing DATABASE_URL. Set DATABASE_URL in your environment variables, then restart the server.",
    );
  });

  it("handles read errors with various status codes", () => {
    assert.strictEqual(
      getScopeWarning(new Error("Failed to read shared state (404).")),
      "Shared sync could not reach the database endpoint (404). Verify DATABASE_URL points to the correct Neon database.",
    );
    assert.strictEqual(
      getScopeWarning(new Error("Failed to read shared state (401).")),
      "Neon rejected the request (401/403). Check DATABASE_URL credentials and permissions.",
    );
    assert.strictEqual(
      getScopeWarning(new Error("Failed to read shared state (403).")),
      "Neon rejected the request (401/403). Check DATABASE_URL credentials and permissions.",
    );
    assert.strictEqual(
      getScopeWarning(new Error("Failed to read shared state (429).")),
      "Neon or upstream rate limit reached. Retry after a short wait.",
    );
    assert.strictEqual(
      getScopeWarning(new Error("Failed to read shared state (500).")),
      "Shared state could not be loaded (HTTP 500). Check server logs and https://status.neon.tech.",
    );
  });

  it("handles general read error prefixes and unexpected value types", () => {
    assert.strictEqual(
      getScopeWarning(new Error("Failed to read shared state: network failure")),
      "Shared state could not be read from Neon Postgres. Check server logs and DATABASE_URL.",
    );
    assert.strictEqual(
      getScopeWarning(new Error("Data contains an unexpected value type")),
      "The database returned an unexpected value when loading shared state. Check server logs.",
    );
  });

  it("handles update errors with various status codes", () => {
    assert.strictEqual(
      getScopeWarning(new Error("Failed to update shared state (404).")),
      "Shared sync could not reach the database endpoint while saving (404). Verify DATABASE_URL.",
    );
    assert.strictEqual(
      getScopeWarning(new Error("Failed to update shared state (401).")),
      "Neon rejected the save (401/403). Verify DATABASE_URL credentials allow writes.",
    );
    assert.strictEqual(
      getScopeWarning(new Error("Failed to update shared state (403).")),
      "Neon rejected the save (401/403). Verify DATABASE_URL credentials allow writes.",
    );
    assert.strictEqual(
      getScopeWarning(new Error("Failed to update shared state (429).")),
      "Rate limit reached while saving. Retry after a short wait.",
    );
    assert.strictEqual(
      getScopeWarning(new Error("Failed to update shared state (500).")),
      "Shared state could not be saved (HTTP 500). Check server logs.",
    );
  });

  it("handles general update error prefixes", () => {
    assert.strictEqual(
      getScopeWarning(new Error("Failed to update shared state: write error")),
      "Shared state could not be written to Neon Postgres. Check server logs and DATABASE_URL.",
    );
  });

  it("handles list errors with status code or general prefix", () => {
    assert.strictEqual(
      getScopeWarning(new Error("list shared state (500).")),
      "Health check could not list shared state rows (HTTP 500). Check database credentials.",
    );
    assert.strictEqual(
      getScopeWarning(new Error("list shared state: permission denied")),
      "Health check could not list shared state rows. Check server logs and database configuration.",
    );
  });

  it("returns fallback message for unrecognized Error messages", () => {
    assert.strictEqual(
      getScopeWarning(new Error("Unknown unexpected error")),
      "Shared state could not be loaded. Check server logs and Neon connectivity.",
    );
  });
});
