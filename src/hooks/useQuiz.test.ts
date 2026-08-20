import assert from "node:assert/strict";
import test from "node:test";

import {
  addQuestionToData,
  updateQuestionInData,
  deleteQuestionFromData,
  updateCharacterDescriptionInData,
  updateNeitherDescriptionInData,
} from "../components/quiz/lib/quizMutations.ts";

import type { QuizData } from "../services/state/stateTypes.ts";
import type { QuizQuestion, QuizCharacter } from "../components/quiz/lib/types.ts";

const mockQuizData: QuizData = {
  questions: [
    {
      id: "q1",
      text: "First question",
      character1: { character: "aaron" as QuizCharacter, text: "A" },
      character2: { character: "electra" as QuizCharacter, text: "B" },
    },
  ],
  characterDescriptions: {
    aaron: "Aaron is cool",
    electra: "Electra is smart",
    neither: "Neither",
  },
  neitherDescription: "None of the above",
};

test("useQuiz mutation helpers correctly transform state", async (t) => {
  await t.test("addQuestionToData appends a question", () => {
    const newQuestion: QuizQuestion = {
      id: "q2",
      text: "Second question",
      character1: { character: "aaron" as QuizCharacter, text: "C" },
      character2: { character: "electra" as QuizCharacter, text: "D" },
    };
    const result = addQuestionToData(mockQuizData, newQuestion);
    assert.equal(result.questions.length, 2);
    assert.deepEqual(result.questions[1], newQuestion);
  });

  await t.test("updateQuestionInData modifies an existing question", () => {
    const updatedQuestion: QuizQuestion = {
      ...mockQuizData.questions[0],
      text: "Updated text",
    };
    const result = updateQuestionInData(mockQuizData, "q1", updatedQuestion);
    assert.equal(result.questions.length, 1);
    assert.equal(result.questions[0].text, "Updated text");
  });

  await t.test("deleteQuestionFromData removes a question", () => {
    const result = deleteQuestionFromData(mockQuizData, "q1");
    assert.equal(result.questions.length, 0);
  });

  await t.test("updateCharacterDescriptionInData modifies description", () => {
    const result = updateCharacterDescriptionInData(mockQuizData, "aaron" as QuizCharacter, "Aaron is super cool");
    assert.equal(result.characterDescriptions.aaron, "Aaron is super cool");
    assert.equal(result.characterDescriptions.electra, "Electra is smart"); // unchanged
  });

  await t.test("updateNeitherDescriptionInData modifies neither description", () => {
    const result = updateNeitherDescriptionInData(mockQuizData, "Something else");
    assert.equal(result.neitherDescription, "Something else");
  });
});
