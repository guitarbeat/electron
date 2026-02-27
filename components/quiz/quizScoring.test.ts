import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { calculateQuizResults } from './quizScoring.ts';
import type { QuizQuestion, QuizAnswer, QuizCharacter } from './types.ts';

describe('calculateQuizResults', () => {
  const characters: QuizCharacter[] = ['Electra', 'Aaron', 'Madeleine', 'Nosferatu/Smeemo'];

  test('should return 0 scores when no answers are provided', () => {
    const questions: QuizQuestion[] = [];
    const answers: QuizAnswer[] = [];

    const result = calculateQuizResults(answers, questions);

    assert.equal(result.character, 'Neither');
    characters.forEach((char) => {
      assert.equal(result.scores[char], 0);
      assert.equal(result.percentages[char], 0);
    });
  });

  test('should calculate scores for multiple choice questions', () => {
    const questions: QuizQuestion[] = [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'Q1',
        options: [
          { text: 'A', scores: { Electra: 10 } },
          { text: 'B', scores: { Aaron: 5 } },
        ],
      },
    ];

    const answers: QuizAnswer[] = [{ questionId: 'q1', answerIndex: 0 }];

    const result = calculateQuizResults(answers, questions);

    assert.equal(result.scores.Electra, 10);
    assert.equal(result.scores.Aaron, 0);
    assert.equal(result.character, 'Electra');
    assert.equal(result.percentages.Electra, 100);
  });

  test('should calculate scores for agree-disagree questions', () => {
    const questions: QuizQuestion[] = [
      {
        id: 'q2',
        type: 'agree-disagree',
        question: 'Q2',
        scores: {
          stronglyDisagree: { Aaron: 10 },
          disagree: { Aaron: 5 },
          neutral: {},
          agree: { Madeleine: 5 },
          stronglyAgree: { Madeleine: 10 },
        },
      },
    ];

    const answers: QuizAnswer[] = [{ questionId: 'q2', scaleValue: 'stronglyAgree' }];

    const result = calculateQuizResults(answers, questions);

    assert.equal(result.scores.Madeleine, 10);
    assert.equal(result.scores.Aaron, 0);
    assert.equal(result.character, 'Madeleine');
  });

  test('should calculate scores for XY axis questions', () => {
    const questions: QuizQuestion[] = [
      {
        id: 'q3',
        type: 'xy-axis',
        question: 'Q3',
        xAxis: { leftLabel: 'L', rightLabel: 'R' },
        yAxis: { topLabel: 'T', bottomLabel: 'B' },
        quadrantScores: {
          topLeft: { Electra: 10 }, // x < 0, y > 0
          topRight: { Aaron: 10 }, // x > 0, y > 0
          bottomLeft: { Madeleine: 10 }, // x < 0, y < 0
          bottomRight: { 'Nosferatu/Smeemo': 10 }, // x > 0, y < 0
        },
      },
    ];

    // Test Top Right (Aaron)
    const answersTR: QuizAnswer[] = [{ questionId: 'q3', xyPosition: { x: 0.5, y: 0.5 } }];
    const resultTR = calculateQuizResults(answersTR, questions);
    // Weight logic: x*y = 0.25. Total weight = 0.25.
    // Score = (10 * 0.25) / 0.25 = 10.
    assert.equal(resultTR.scores.Aaron, 10);
    assert.equal(resultTR.character, 'Aaron');

    // Test Bottom Left (Madeleine)
    const answersBL: QuizAnswer[] = [{ questionId: 'q3', xyPosition: { x: -0.8, y: -0.8 } }];
    const resultBL = calculateQuizResults(answersBL, questions);
    assert.equal(resultBL.scores.Madeleine, 10);
    assert.equal(resultBL.character, 'Madeleine');
  });

  test('should return "Neither" if top score is less than 35% of total', () => {
    const questions: QuizQuestion[] = [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'Q1',
        options: [
          {
            text: 'Split',
            scores: {
              Electra: 3,
              Aaron: 3,
              Madeleine: 3,
              'Nosferatu/Smeemo': 3,
            },
          },
        ],
      },
    ];

    const answers: QuizAnswer[] = [{ questionId: 'q1', answerIndex: 0 }];

    // Total score = 12. Top score = 3. 3/12 = 0.25 (25%).
    // 25% < 35%, so should be "Neither".

    const result = calculateQuizResults(answers, questions);

    assert.equal(result.character, 'Neither');
    assert.equal(result.scores.Electra, 3);
  });

  test('should handle tie-breaking using sort order', () => {
    // If scores are equal, sort order determines winner.
    // Current sort: b - a (descending score). If equal, stable sort or engine dependent?
    // actually, Object.keys(scores) order matters if sort is unstable for equal values,
    // but the implementation uses: (Object.keys(scores) as QuizCharacter[]).sort((a, b) => scores[b] - scores[a])
    // If scores[b] - scores[a] === 0, order is preserved from keys array.
    // Keys usually follow insertion order or definition order in CHARACTERS array if reduced correctly.

    const questions: QuizQuestion[] = [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'Q1',
        options: [{ text: 'Tie', scores: { Electra: 10, Aaron: 10 } }],
      },
    ];

    const answers: QuizAnswer[] = [{ questionId: 'q1', answerIndex: 0 }];

    const result = calculateQuizResults(answers, questions);

    // Based on standard JS sort behavior for 0, it often preserves order.
    // In `quizScoring.ts`:
    // const scores = CHARACTERS.reduce(...) -> keys order is CHARACTERS order.
    // CHARACTERS = ['Aaron', 'Electra', 'Madeleine', 'Nosferatu/Smeemo']
    // Aaron comes before Electra in keys.
    // sort((a,b) => 10 - 10) -> 0.
    // If stable sort (modern JS engines), 'Aaron' should come first.

    assert.equal(result.scores.Aaron, 10);
    assert.equal(result.scores.Electra, 10);
    assert.equal(result.character, 'Aaron');
  });
});
