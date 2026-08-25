import assert from "node:assert/strict";
import test from "node:test";

import {
  CHARACTERS,
  calculateQuizResults,
  normalizeQuizPercentages,
  quizQuestions,
  type QuizAnswer,
  type QuizCharacter,
  type QuizQuestion,
} from "./quizData";

const primaryChoiceIndex: Record<QuizCharacter, number> = {
  Aaron: 0,
  Electra: 1,
  Madeleine: 2,
  "Nosferatu/Smeemo": 3,
};

const scaleChoices: Record<QuizCharacter, QuizAnswer["scaleValue"][]> = {
  Aaron: ["stronglyAgree", "stronglyAgree"],
  Electra: ["agree", "stronglyAgree"],
  Madeleine: ["stronglyDisagree", "agree"],
  "Nosferatu/Smeemo": ["stronglyDisagree", "stronglyDisagree"],
};

const buildAnswersFor = (character: QuizCharacter): QuizAnswer[] => {
  let scaleIndex = 0;
  return quizQuestions.map((question) => {
    if (question.type === "agree-disagree") {
      const scaleValue = scaleChoices[character][scaleIndex];
      scaleIndex += 1;
      return { questionId: question.id, scaleValue };
    }

    return {
      questionId: question.id,
      answerIndex: primaryChoiceIndex[character],
    };
  });
};

test("the movie-night quiz contains seven quick questions", () => {
  assert.equal(quizQuestions.length, 7);
  assert.deepEqual(
    quizQuestions.reduce<Record<string, number>>((counts, question) => {
      counts[question.type] = (counts[question.type] ?? 0) + 1;
      return counts;
    }, {}),
    { "multiple-choice": 4, "agree-disagree": 2, "image-choice": 1 },
  );
});

for (const character of CHARACTERS) {
  test(`balanced primary answers can produce ${character}`, () => {
    const result = calculateQuizResults(
      buildAnswersFor(character),
      quizQuestions,
    );
    assert.equal(result.character, character);
    assert.equal(
      Object.values(result.percentages).reduce((sum, value) => sum + value, 0),
      100,
    );
  });
}

test("a broadly balanced answer set produces the hybrid result", () => {
  const choiceOrder = [0, 1, 2, 3, 0];
  let choiceIndex = 0;
  const answers = quizQuestions.map<QuizAnswer>((question) => {
    if (question.type === "agree-disagree") {
      return { questionId: question.id, scaleValue: "neutral" };
    }
    const answerIndex = choiceOrder[choiceIndex] ?? 0;
    choiceIndex += 1;
    return { questionId: question.id, answerIndex };
  });

  assert.equal(calculateQuizResults(answers, quizQuestions).character, "Neither");
});

test("ties resolve deterministically using character order", () => {
  const tiedQuestion: QuizQuestion = {
    id: "tie",
    type: "multiple-choice",
    question: "Tie",
    options: [{ text: "Tie", scores: { Aaron: 2, Electra: 2 } }],
  };
  const result = calculateQuizResults(
    [{ questionId: tiedQuestion.id, answerIndex: 0 }],
    [tiedQuestion],
  );

  assert.equal(result.character, "Aaron");
});

test("percentage rounding always totals exactly 100", () => {
  const percentages = normalizeQuizPercentages({
    Aaron: 1,
    Electra: 1,
    Madeleine: 1,
    "Nosferatu/Smeemo": 0,
  });

  assert.deepEqual(percentages, {
    Aaron: 34,
    Electra: 33,
    Madeleine: 33,
    "Nosferatu/Smeemo": 0,
  });
  assert.equal(
    Object.values(percentages).reduce((sum, value) => sum + value, 0),
    100,
  );
});
