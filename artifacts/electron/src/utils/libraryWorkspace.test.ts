import assert from "node:assert/strict";
import test from "node:test";
import {
  isLibraryWorkspaceTab,
  libraryWorkspaceStackClass,
  LIBRARY_TAB,
} from "./libraryWorkspace.ts";

test("isLibraryWorkspaceTab treats movies and places as one workspace", () => {
  assert.equal(isLibraryWorkspaceTab("movies"), true);
  assert.equal(isLibraryWorkspaceTab("places"), true);
  assert.equal(isLibraryWorkspaceTab("memories"), false);
  assert.equal(isLibraryWorkspaceTab("messages"), false);
});

test("library workspace keeps the movies stack class so poster-grid styles apply", () => {
  assert.equal(LIBRARY_TAB, "movies");
  assert.equal(libraryWorkspaceStackClass("movies"), "app-workspace-stack--movies");
  assert.equal(libraryWorkspaceStackClass("places"), "app-workspace-stack--movies");
  assert.equal(
    libraryWorkspaceStackClass("memories"),
    "app-workspace-stack--memories",
  );
});
