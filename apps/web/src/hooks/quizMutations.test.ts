import test from "node:test";
import assert from "node:assert/strict";
import { quizMutations } from "./quizMutations.ts";

test("quizMutations", async (t) => {
  const initialData = {
    questions: [
      { id: "q1", title: "Existing", character: "charA", options: [] },
    ],
    characterDescriptions: {
      charA: "Desc A",
    },
    neitherDescription: "Neither desc",
  };

  await t.test("updateQuestions replaces all questions", () => {
    const newQuestions = [
      { id: "q10", title: "Q10", character: "charC", options: [] },
    ];

    const updatedData = quizMutations.updateQuestions(newQuestions)(initialData);

    assert.deepEqual(updatedData.questions, newQuestions);
    assert.equal(updatedData.neitherDescription, "Neither desc");
  });

  await t.test("addQuestion appends a new question", () => {
    const newQuestion = { id: "q2", title: "New Q2", character: "charB", options: [] };

    const updatedData = quizMutations.addQuestion(newQuestion)(initialData);

    assert.equal(updatedData.questions.length, 2);
    assert.deepEqual(updatedData.questions[1], newQuestion);
  });

  await t.test("updateQuestion modifies the correct question", () => {
    const updatedQuestion = { id: "q1", title: "Updated Q1", character: "charC", options: [] };

    const updatedData = quizMutations.updateQuestion("q1", updatedQuestion)(initialData);

    assert.equal(updatedData.questions.length, 1);
    assert.deepEqual(updatedData.questions[0], updatedQuestion);
  });

  await t.test("deleteQuestion removes the correct question", () => {
    const updatedData = quizMutations.deleteQuestion("q1")(initialData);

    assert.equal(updatedData.questions.length, 0);
  });

  await t.test("updateCharacterDescription updates the description for a character", () => {
    const updatedData = quizMutations.updateCharacterDescription("charB", "Desc B")(initialData);

    assert.equal(updatedData.characterDescriptions.charA, "Desc A");
    assert.equal(updatedData.characterDescriptions.charB, "Desc B");
  });

  await t.test("updateNeitherDescription updates the neither description", () => {
    const updatedData = quizMutations.updateNeitherDescription("New Neither Desc")(initialData);

    assert.equal(updatedData.neitherDescription, "New Neither Desc");
  });
});
