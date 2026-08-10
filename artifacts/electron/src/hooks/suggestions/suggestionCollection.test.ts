import assert from "node:assert/strict";
import test from "node:test";
import type { MovieSuggestion } from "@/shared/types";
import {
  getPendingSuggestions,
  updateSuggestionStatus,
} from "./suggestionCollection.ts";

const pending: MovieSuggestion = {
  id: "suggestion-1",
  title: "Arrival",
  suggestedBy: "Aaron",
  status: "pending",
  createdAt: "2026-08-10T00:00:00.000Z",
};

test("getPendingSuggestions returns only pending records", () => {
  const accepted: MovieSuggestion = { ...pending, id: "suggestion-2", status: "accepted" };
  assert.deepEqual(getPendingSuggestions([pending, accepted]), [pending]);
});

test("updateSuggestionStatus changes one record without mutating the collection", () => {
  const records = [pending];
  const updated = updateSuggestionStatus(
    records,
    pending.id,
    "accepted",
    "Electra",
    "2026-08-10T01:00:00.000Z",
  );

  assert.equal(records[0].status, "pending");
  assert.deepEqual(updated[0], {
    ...pending,
    status: "accepted",
    respondedBy: "Electra",
    respondedAt: "2026-08-10T01:00:00.000Z",
  });
});

test("updateSuggestionStatus rejects unknown suggestion ids", () => {
  assert.throws(
    () => updateSuggestionStatus([pending], "missing", "rejected", "Aaron"),
    /Suggestion not found/,
  );
});
