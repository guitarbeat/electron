import type { QuizQuestion } from "./types";

export const QUESTION_TYPE_LABELS: Record<QuizQuestion["type"], string> = {
  "multiple-choice": "Multiple Choice",
  "agree-disagree": "Agree / Disagree",
  "image-choice": "Image Choice",
  "xy-axis": "2D Spectrum",
};

export const getQuestionDetail = (question: QuizQuestion): string => {
  switch (question.type) {
    case "multiple-choice":
      return `${question.options.length} answer choices`;
    case "agree-disagree":
      return "5-point response scale";
    case "image-choice":
      return `${question.options.length} image choices`;
    case "xy-axis":
      return `${question.xAxis.leftLabel} to ${question.xAxis.rightLabel}`;
    default:
      return "";
  }
};
