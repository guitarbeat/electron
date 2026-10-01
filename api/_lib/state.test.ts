import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { STATE_SCOPES } from "../../apps/web/src/services/state/stateTypes.js";
import {
  bootstrapMissingScopeFiles,
  getPinCoverageState,
  getPinProtectedUsers,
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

describe("getPinProtectedUsers and getPinCoverageState", () => {
  it("returns empty pinProtectedUsers and correct missing users when no users have PINs set", async () => {
    const pinsFilename = getScopeDefinition("pins").filename;
    const store = sharedStateStore.installSharedStateMemoryStoreForTests({
      [pinsFilename]: JSON.stringify({}),
    });

    try {
      const coverage = await getPinCoverageState();
      assert.deepStrictEqual(coverage.pinProtectedUsers, []);
      assert.deepStrictEqual(coverage.usersMissingPins, ["Aaron", "Electra"]);
      assert.strictEqual(coverage.pinCoverageComplete, false);

      const protectedUsers = await getPinProtectedUsers();
      assert.deepStrictEqual(protectedUsers, []);
    } finally {
      store.dispose();
    }
  });

  it("returns partial pinProtectedUsers when only one user has a PIN set", async () => {
    const pinsFilename = getScopeDefinition("pins").filename;
    const store = sharedStateStore.installSharedStateMemoryStoreForTests({
      [pinsFilename]: JSON.stringify({ Aaron: "hashed_pin_1234" }),
    });

    try {
      const coverage = await getPinCoverageState();
      assert.deepStrictEqual(coverage.pinProtectedUsers, ["Aaron"]);
      assert.deepStrictEqual(coverage.usersMissingPins, ["Electra"]);
      assert.strictEqual(coverage.pinCoverageComplete, false);

      const protectedUsers = await getPinProtectedUsers();
      assert.deepStrictEqual(protectedUsers, ["Aaron"]);
    } finally {
      store.dispose();
    }
  });

  it("returns all users as protected when all users have PINs set", async () => {
    const pinsFilename = getScopeDefinition("pins").filename;
    const store = sharedStateStore.installSharedStateMemoryStoreForTests({
      [pinsFilename]: JSON.stringify({
        Aaron: "hash_aaron",
        Electra: "hash_electra",
      }),
    });

    try {
      const coverage = await getPinCoverageState();
      assert.deepStrictEqual(coverage.pinProtectedUsers, ["Aaron", "Electra"]);
      assert.deepStrictEqual(coverage.usersMissingPins, []);
      assert.strictEqual(coverage.pinCoverageComplete, true);

      const protectedUsers = await getPinProtectedUsers();
      assert.deepStrictEqual(protectedUsers, ["Aaron", "Electra"]);
    } finally {
      store.dispose();
    }
  });

  it("falls back to empty state when readScopeStoredData throws an error", async () => {
    const originalDbUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = "postgres://invalid:invalid@127.0.0.1:5432/invalid";
    sharedStateStore.invalidateSharedStateCache();

    try {
      const coverage = await getPinCoverageState();
      assert.deepStrictEqual(coverage.pinProtectedUsers, []);
      assert.deepStrictEqual(coverage.usersMissingPins, []);
      assert.strictEqual(coverage.pinCoverageComplete, true);

      const protectedUsers = await getPinProtectedUsers();
      assert.deepStrictEqual(protectedUsers, []);
    } finally {
      if (originalDbUrl !== undefined) {
        process.env.DATABASE_URL = originalDbUrl;
      } else {
        delete process.env.DATABASE_URL;
      }
      sharedStateStore.invalidateSharedStateCache();
    }
  });
});
