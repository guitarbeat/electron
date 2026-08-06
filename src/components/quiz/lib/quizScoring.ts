import { CHARACTERS } from "./types.ts";
import type {
  QuizQuestion,
  QuizAnswer,
  CharacterScores,
  QuizResult,
  QuizCharacter,
} from "./types.ts";

export const calculateQuizResults = (
  answers: QuizAnswer[],
  questions: QuizQuestion[],
): QuizResult => {
  // Initialize scores dynamically based on CHARACTERS constant
  const scores: CharacterScores = CHARACTERS.reduce((acc, char) => {
    acc[char] = 0;
    return acc;
  }, {} as CharacterScores);

  // Calculate scores from answers
  answers.forEach((answer) => {
    const question = questions.find((q) => q.id === answer.questionId);
    if (!question) return;

    if (
      question.type === "multiple-choice" &&
      answer.answerIndex !== undefined
    ) {
      const option = question.options[answer.answerIndex];
      Object.entries(option.scores).forEach(([char, score]) => {
        scores[char as QuizCharacter] += score as number;
      });
    } else if (question.type === "agree-disagree" && answer.scaleValue) {
      const scaleScores = question.scores[answer.scaleValue];
      Object.entries(scaleScores).forEach(([char, score]) => {
        scores[char as QuizCharacter] += score as number;
      });
    } else if (
      question.type === "image-choice" &&
      answer.answerIndex !== undefined
    ) {
      const option = question.options[answer.answerIndex];
      Object.entries(option.scores).forEach(([char, score]) => {
        scores[char as QuizCharacter] += score as number;
      });
    } else if (question.type === "xy-axis" && answer.xyPosition) {
      // Calculate quadrant weights based on position
      const { x, y } = answer.xyPosition;
      const { quadrantScores } = question;

      // Weight calculation: how much each quadrant contributes
      // topLeft: x < 0, y > 0
      // topRight: x > 0, y > 0
      // bottomLeft: x < 0, y < 0
      // bottomRight: x > 0, y < 0
      const tlWeight = Math.max(0, -x) * Math.max(0, y);
      const trWeight = Math.max(0, x) * Math.max(0, y);
      const blWeight = Math.max(0, -x) * Math.max(0, -y);
      const brWeight = Math.max(0, x) * Math.max(0, -y);

      const totalWeight = tlWeight + trWeight + blWeight + brWeight || 1;

      // Apply weighted scores from each quadrant
      const applyQuadrant = (
        qScores: Partial<Record<QuizCharacter, number>>,
        weight: number,
      ) => {
        Object.entries(qScores).forEach(([char, score]) => {
          scores[char as QuizCharacter] +=
            ((score as number) * weight) / totalWeight;
        });
      };

      applyQuadrant(quadrantScores.topLeft, tlWeight);
      applyQuadrant(quadrantScores.topRight, trWeight);
      applyQuadrant(quadrantScores.bottomLeft, blWeight);
      applyQuadrant(quadrantScores.bottomRight, brWeight);
    }
  });

  // Find highest scoring character
  const sortedCharacters = (Object.keys(scores) as QuizCharacter[]).sort(
    (a, b) => scores[b] - scores[a],
  );
  const [topCharacter] = sortedCharacters;

  // Calculate percentages
  const totalScore = Object.values(scores).reduce(
    (sum, score) => sum + score,
    0,
  );

  const percentages: Record<QuizCharacter, number> = CHARACTERS.reduce(
    (acc, char) => {
      acc[char] =
        totalScore > 0
          ? Math.round((scores[char] / totalScore) * 100) || 0
          : 0;
      return acc;
    },
    {} as Record<QuizCharacter, number>,
  );

  // Determine if result is "Neither"
  // If the top character has less than 35% of the total score, it's a weak match
  // Also default to "Neither" if total score is 0
  const topScore = scores[topCharacter];
  const isNeither =
    totalScore <= 0 || (totalScore > 0 && topScore / totalScore < 0.35);

  const result: QuizResult = {
    character: isNeither ? "Neither" : topCharacter,
    scores,
    percentages,
  };

  return result;
};
