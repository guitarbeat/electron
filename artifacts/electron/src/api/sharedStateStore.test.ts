import assert from "node:assert/strict";
import test from "node:test";

import {
  installSharedStateMemoryStoreForTests,
  readSharedStateFileRecord,
  patchSharedStateFile,
  listSharedStateFilenames,
} from "../../../../api/_lib/sharedStateStore.ts";

test("readSharedStateFileRecord distinguishes missing rows from present empty strings", async () => {
  const mock = installSharedStateMemoryStoreForTests({
    "empty.json": "",
  });

  try {
    const presentEmpty = await readSharedStateFileRecord("empty.json");
    const missing = await readSharedStateFileRecord("missing.json");

    assert.deepEqual(presentEmpty, { exists: true, content: "" });
    assert.deepEqual(missing, { exists: false, content: null });
  } finally {
    mock.dispose();
  }
});

test("patchSharedStateFile upserts content and listSharedStateFilenames returns sorted names", async () => {
  const mock = installSharedStateMemoryStoreForTests({
    "movielist.json": "[]",
  });

  try {
    await patchSharedStateFile("messages.json", '[{"id":"message-1"}]');
    await patchSharedStateFile("movielist.json", '[{"id":"movie-1"}]');

    assert.equal(mock.getFile("messages.json"), '[{"id":"message-1"}]');
    assert.equal(mock.getFile("movielist.json"), '[{"id":"movie-1"}]');
    assert.deepEqual(await listSharedStateFilenames(), [
      "messages.json",
      "movielist.json",
    ]);
    assert.deepEqual(mock.patchBodies, [
      '[{"id":"message-1"}]',
      '[{"id":"movie-1"}]',
    ]);
  } finally {
    mock.dispose();
  }
});
