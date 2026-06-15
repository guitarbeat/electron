/**
 * Question Templates
 *
 * Pre-defined question templates for quick creation
 */

import { QuizQuestion, QuizCharacter } from "./types";

export type TemplateType =
  | "personality"
  | "agree-disagree"
  | "image-grid"
  | "xy-axis"
  | "blank";

interface QuestionTemplate {
  id: TemplateType;
  name: string;
  description: string;
  icon: string;
  create: () => QuizQuestion;
}

// Balanced score distribution for 4 options
const personalityScores: Partial<Record<QuizCharacter, number>>[] = [
  { Aaron: 2, Electra: 1, Madeleine: 0, "Nosferatu/Smeemo": 0 },
  { Aaron: 0, Electra: 2, Madeleine: 1, "Nosferatu/Smeemo": 0 },
  { Aaron: 1, Electra: 0, Madeleine: 2, "Nosferatu/Smeemo": 1 },
  { Aaron: 0, Electra: 0, Madeleine: 1, "Nosferatu/Smeemo": 2 },
];

// Progressive agree/disagree scores
const agreeDisagreeScores = {
  stronglyDisagree: {
    Aaron: 0,
    Electra: 2,
    Madeleine: 1,
    "Nosferatu/Smeemo": 0,
  },
  disagree: { Aaron: 0, Electra: 1, Madeleine: 1, "Nosferatu/Smeemo": 0 },
  neutral: { Aaron: 1, Electra: 0, Madeleine: 0, "Nosferatu/Smeemo": 1 },
  agree: { Aaron: 1, Electra: 0, Madeleine: 0, "Nosferatu/Smeemo": 1 },
  stronglyAgree: { Aaron: 2, Electra: 0, Madeleine: 0, "Nosferatu/Smeemo": 2 },
};

// Image grid scores (one strong per character)
const imageGridScores: Partial<Record<QuizCharacter, number>>[] = [
  { Aaron: 3, Electra: 0, Madeleine: 0, "Nosferatu/Smeemo": 0 },
  { Aaron: 0, Electra: 3, Madeleine: 0, "Nosferatu/Smeemo": 0 },
  { Aaron: 0, Electra: 0, Madeleine: 3, "Nosferatu/Smeemo": 0 },
  { Aaron: 0, Electra: 0, Madeleine: 0, "Nosferatu/Smeemo": 3 },
];

export const questionTemplates: QuestionTemplate[] = [
  {
    id: "personality",
    name: "Personality Preference",
    description: "4 options with balanced character scores",
    icon: "🎭",
    create: () => ({
      id: `q_${Date.now()}`,
      type: "multiple-choice",
      question: "What describes you best?",
      options: [
        {
          text: "I prefer quiet evenings at home",
          scores: personalityScores[0],
        },
        {
          text: "I love social gatherings and parties",
          scores: personalityScores[1],
        },
        { text: "I enjoy creative activities", scores: personalityScores[2] },
        {
          text: "I like exploring mysterious places",
          scores: personalityScores[3],
        },
      ],
    }),
  },
  {
    id: "agree-disagree",
    name: "Agree/Disagree Statement",
    description: "Scale response with pre-set scoring",
    icon: "⚖️",
    create: () => ({
      id: `q_${Date.now()}`,
      type: "agree-disagree",
      question: "I prefer planning ahead rather than being spontaneous.",
      scores: agreeDisagreeScores,
    }),
  },
  {
    id: "image-grid",
    name: "Image Grid",
    description: "4 images, each matching a character",
    icon: "🖼️",
    create: () => ({
      id: `q_${Date.now()}`,
      type: "image-choice",
      question: "Which image speaks to you most?",
      options: [
        {
          imageUrl: "/quiz-photos/quiz-img-1.png",
          alt: "Cozy home scene",
          scores: imageGridScores[0],
        },
        {
          imageUrl: "/quiz-photos/quiz-img-2.png",
          alt: "Vibrant party",
          scores: imageGridScores[1],
        },
        {
          imageUrl: "/quiz-photos/quiz-img-3.png",
          alt: "Art studio",
          scores: imageGridScores[2],
        },
        {
          imageUrl: "/quiz-photos/quiz-img-4.png",
          alt: "Dark forest",
          scores: imageGridScores[3],
        },
      ],
    }),
  },
  {
    id: "xy-axis",
    name: "XY Axis / 2D Spectrum",
    description: "Place position on 2D grid",
    icon: "📊",
    create: () => ({
      id: `q_${Date.now()}`,
      type: "xy-axis",
      question: "Where do you see yourself on this grid?",
      xAxis: { leftLabel: "Solo", rightLabel: "Social" },
      yAxis: { topLabel: "Spontaneous", bottomLabel: "Planned" },
      quadrantScores: {
        topLeft: { Aaron: 2, Electra: 0, Madeleine: 0, "Nosferatu/Smeemo": 0 },
        topRight: { Aaron: 0, Electra: 2, Madeleine: 0, "Nosferatu/Smeemo": 0 },
        bottomLeft: {
          Aaron: 0,
          Electra: 0,
          Madeleine: 0,
          "Nosferatu/Smeemo": 2,
        },
        bottomRight: {
          Aaron: 0,
          Electra: 0,
          Madeleine: 2,
          "Nosferatu/Smeemo": 0,
        },
      },
    }),
  },
  {
    id: "blank",
    name: "Blank Question",
    description: "Start from scratch",
    icon: "📝",
    create: () => ({
      id: `q_${Date.now()}`,
      type: "multiple-choice",
      question: "New question?",
      options: [
        { text: "Option 1", scores: {} },
        { text: "Option 2", scores: {} },
      ],
    }),
  },
];
