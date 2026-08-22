import assert from "node:assert/strict";
import test from "node:test";
import { submitMemory } from "./index.ts";

test("submitMemory", async (t) => {
  await t.test("handles successful submission", async () => {
    let isSubmitting = false;
    let draftNote = "Initial note";
    let success = false;
    let error: string | null = "Initial error";
    let timeoutCleared = false;
    let timeoutCallback: (() => void) | null = null;
    let timeoutDelay = 0;

    let addedNote = "";
    const onAddMemory = async (note: string) => {
      addedNote = note;
    };

    const callbacks = {
      setIsSubmittingMemory: (v: boolean) => {
        isSubmitting = v;
      },
      setDraftNote: (note: string) => {
        draftNote = note;
      },
      setSubmitSuccess: (v: boolean) => {
        success = v;
      },
      setSubmitError: (e: string | null) => {
        error = e;
      },
      clearSuccessTimeout: () => {
        timeoutCleared = true;
      },
      setSuccessTimeout: (cb: () => void, delay: number) => {
        timeoutCallback = cb;
        timeoutDelay = delay;
      },
    };

    // Before submit memory finishes
    const promise = submitMemory("  A valid note  ", onAddMemory, callbacks);

    // Assert optimistic states right after calling
    assert.equal(isSubmitting, true);
    assert.equal(error, null);

    await promise;

    assert.equal(addedNote, "A valid note");
    assert.equal(draftNote, "");
    assert.equal(success, true);
    assert.equal(timeoutCleared, true);
    assert.equal(timeoutDelay, 1200);
    assert.ok(timeoutCallback !== null);
    assert.equal(isSubmitting, false); // finally block

    // Test the timeout callback sets success to false
    (timeoutCallback as () => void)();
    assert.equal(success, false);
  });

  await t.test("handles error path", async () => {
    let isSubmitting = false;
    let draftNote = "Initial note";
    let success = false;
    let error: string | null = null;

    const onAddMemory = async () => {
      throw new Error("Simulated network error");
    };

    const callbacks = {
      setIsSubmittingMemory: (v: boolean) => {
        isSubmitting = v;
      },
      setDraftNote: (note: string) => {
        draftNote = note;
      },
      setSubmitSuccess: (v: boolean) => {
        success = v;
      },
      setSubmitError: (e: string | null) => {
        error = e;
      },
      clearSuccessTimeout: () => {},
      setSuccessTimeout: () => {},
    };

    await submitMemory("A valid note", onAddMemory, callbacks);

    // Draft note shouldn't be cleared
    assert.equal(draftNote, "Initial note");
    assert.equal(success, false);
    assert.equal(error, "Failed to save note. Please try again.");
    assert.equal(isSubmitting, false);
  });

  await t.test("ignores empty strings", async () => {
    let addedCount = 0;
    const onAddMemory = async () => {
      addedCount++;
    };

    let isSubmittingCallCount = 0;

    const callbacks = {
      setIsSubmittingMemory: () => {
        isSubmittingCallCount++;
      },
      setDraftNote: () => {},
      setSubmitSuccess: () => {},
      setSubmitError: () => {},
      clearSuccessTimeout: () => {},
      setSuccessTimeout: () => {},
    };

    await submitMemory("   ", onAddMemory, callbacks);

    assert.equal(addedCount, 0);
    assert.equal(isSubmittingCallCount, 0); // shouldn't be called
  });
});
