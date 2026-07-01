import assert from "node:assert/strict";
import test from "node:test";
import { getWorkspaceMeta } from "./shellState.ts";

test("getWorkspaceMeta", async (t) => {
  await t.test("returns movie workspace copy", () => {
    const meta = getWorkspaceMeta("movies");

    assert.equal(meta.title, "Movies");
    assert.equal(meta.icon, "🎬");
    assert.equal("description" in meta, false);
  });

  await t.test("returns places workspace copy", () => {
    const meta = getWorkspaceMeta("places");

    assert.equal(meta.title, "Date Ideas");
    assert.equal(meta.icon, "📍");
    assert.equal("description" in meta, false);
  });
});
