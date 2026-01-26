/**
 * Quiz Type Definitions
 *
 * Type definitions for the personality quiz system
 */

export type QuizCharacter = 'Electra' | 'Aaron' | 'Madeleine' | 'Nosferatu/Smeemo';

export type QuestionType = 'multiple-choice' | 'agree-disagree' | 'image-choice';

// Multiple Choice Question
export interface MultipleChoiceOption {
  text: string;
  scores: Partial<Record<QuizCharacter, number>>;
}

export interface MultipleChoiceQuestion {
  id: string;
  type: 'multiple-choice';
  question: string;
  options: MultipleChoiceOption[];
}

// Agree/Disagree Scale Question
export interface AgreeDisagreeQuestion {
  id: string;
  type: 'agree-disagree';
  question: string;
  // Scores for each level: [Strongly Disagree, Disagree, Neutral, Agree, Strongly Agree]
  scores: {
    stronglyDisagree: Partial<Record<QuizCharacter, number>>;
    disagree: Partial<Record<QuizCharacter, number>>;
    neutral: Partial<Record<QuizCharacter, number>>;
    agree: Partial<Record<QuizCharacter, number>>;
    stronglyAgree: Partial<Record<QuizCharacter, number>>;
  };
}

// Image Choice Question
export interface ImageChoiceOption {
  imageUrl: string;
  alt: string;
  scores: Partial<Record<QuizCharacter, number>>;
}

export interface ImageChoiceQuestion {
  id: string;
  type: 'image-choice';
  question: string;
  options: ImageChoiceOption[];
}

// Union type for all questions
export type QuizQuestion = MultipleChoiceQuestion | AgreeDisagreeQuestion | ImageChoiceQuestion;

// User's answer to a question
export interface QuizAnswer {
  questionId: string;
  answerIndex?: number; // For multiple choice and image choice
  scaleValue?: 'stronglyDisagree' | 'disagree' | 'neutral' | 'agree' | 'stronglyAgree'; // For agree/disagree
}

// Character scores
export type CharacterScores = Record<QuizCharacter, number>;

// Quiz result
export interface QuizResult {
  character: QuizCharacter | 'Neither';
  scores: CharacterScores;
  percentages: Record<QuizCharacter, number>;
}
