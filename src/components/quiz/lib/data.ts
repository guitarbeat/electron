/**
 * Quiz Data
 *
 * Placeholder quiz questions and character descriptions
 * USER WILL REPLACE THESE WITH ACTUAL CONTENT
 */

import type { QuizQuestion, QuizCharacter } from './types.ts';

export const quizQuestions: QuizQuestion[] = [
  // Multiple Choice Questions (3)
  {
    id: 'mc1',
    type: 'multiple-choice',
    question: "What's your ideal Friday night?",
    options: [
      // SCORING GUIDE:
      // 2 = Strong match
      // 1 = Partial match
      // 0 = No match
      {
        text: 'Watching movies at home',
        scores: { Aaron: 2, Electra: 1, Madeleine: 0, 'Nosferatu/Smeemo': 0 },
      },
      {
        text: 'Going out to a party',
        scores: { Aaron: 0, Electra: 0, Madeleine: 2, 'Nosferatu/Smeemo': 1 },
      },
      {
        text: 'Reading a book alone',
        scores: { Aaron: 1, Electra: 0, Madeleine: 0, 'Nosferatu/Smeemo': 2 },
      },
      {
        text: 'Hanging with close friends',
        scores: { Aaron: 0, Electra: 2, Madeleine: 1, 'Nosferatu/Smeemo': 0 },
      },
    ],
  },
  {
    id: 'mc2',
    type: 'multiple-choice',
    question: 'Pick your favorite color palette:',
    options: [
      {
        text: 'Warm and vibrant',
        scores: { Aaron: 0, Electra: 2, Madeleine: 0, 'Nosferatu/Smeemo': 0 },
      },
      {
        text: 'Cool and calming',
        scores: { Aaron: 2, Electra: 0, Madeleine: 0, 'Nosferatu/Smeemo': 0 },
      },
      {
        text: 'Bold and dramatic',
        scores: { Aaron: 0, Electra: 0, Madeleine: 2, 'Nosferatu/Smeemo': 0 },
      },
      {
        text: 'Dark and mysterious',
        scores: { Aaron: 0, Electra: 0, Madeleine: 0, 'Nosferatu/Smeemo': 2 },
      },
    ],
  },
  {
    id: 'mc3',
    type: 'multiple-choice',
    question: 'How do you handle stress?',
    options: [
      {
        text: 'Talk it out with friends',
        scores: { Aaron: 0, Electra: 2, Madeleine: 1, 'Nosferatu/Smeemo': 0 },
      },
      {
        text: 'Process it internally',
        scores: { Aaron: 2, Electra: 0, Madeleine: 0, 'Nosferatu/Smeemo': 1 },
      },
      {
        text: 'Distract myself with activities',
        scores: { Aaron: 0, Electra: 0, Madeleine: 2, 'Nosferatu/Smeemo': 0 },
      },
      {
        text: 'Embrace the chaos',
        scores: { Aaron: 0, Electra: 0, Madeleine: 0, 'Nosferatu/Smeemo': 2 },
      },
    ],
  },

  // Agree/Disagree Questions (3)
  {
    id: 'ad1',
    type: 'agree-disagree',
    question: 'I prefer spontaneity over planning.',
    scores: {
      stronglyDisagree: { Aaron: 2, Electra: 0, Madeleine: 0, 'Nosferatu/Smeemo': 0 },
      disagree: { Aaron: 1, Electra: 1, Madeleine: 0, 'Nosferatu/Smeemo': 0 },
      neutral: { Aaron: 0, Electra: 0, Madeleine: 1, 'Nosferatu/Smeemo': 0 },
      agree: { Aaron: 0, Electra: 1, Madeleine: 0, 'Nosferatu/Smeemo': 1 },
      stronglyAgree: { Aaron: 0, Electra: 0, Madeleine: 0, 'Nosferatu/Smeemo': 2 },
    },
  },
  {
    id: 'ad2',
    type: 'agree-disagree',
    question: "I'm more of a night owl than an early bird.",
    scores: {
      stronglyDisagree: { Aaron: 2, Electra: 0, Madeleine: 0, 'Nosferatu/Smeemo': 0 },
      disagree: { Aaron: 1, Electra: 0, Madeleine: 0, 'Nosferatu/Smeemo': 0 },
      neutral: { Aaron: 0, Electra: 1, Madeleine: 1, 'Nosferatu/Smeemo': 0 },
      agree: { Aaron: 0, Electra: 0, Madeleine: 0, 'Nosferatu/Smeemo': 1 },
      stronglyAgree: { Aaron: 0, Electra: 0, Madeleine: 0, 'Nosferatu/Smeemo': 2 },
    },
  },
  {
    id: 'ad3',
    type: 'agree-disagree',
    question: 'I enjoy being the center of attention.',
    scores: {
      stronglyDisagree: { Aaron: 2, Electra: 0, Madeleine: 0, 'Nosferatu/Smeemo': 1 },
      disagree: { Aaron: 1, Electra: 0, Madeleine: 0, 'Nosferatu/Smeemo': 0 },
      neutral: { Aaron: 0, Electra: 1, Madeleine: 0, 'Nosferatu/Smeemo': 0 },
      agree: { Aaron: 0, Electra: 1, Madeleine: 1, 'Nosferatu/Smeemo': 0 },
      stronglyAgree: { Aaron: 0, Electra: 0, Madeleine: 2, 'Nosferatu/Smeemo': 0 },
    },
  },

  // Image Choice Questions (3)
  {
    id: 'img1',
    type: 'image-choice',
    question: 'Which aesthetic speaks to you?',
    options: [
      {
        imageUrl: '/quiz-photos/quiz-img-1.png',
        alt: 'Vibrant and fun aesthetic',
        scores: { Aaron: 0, Electra: 2, Madeleine: 0, 'Nosferatu/Smeemo': 0 },
      },
      {
        imageUrl: '/quiz-photos/quiz-img-2.png',
        alt: 'Calm and serene aesthetic',
        scores: { Aaron: 2, Electra: 0, Madeleine: 0, 'Nosferatu/Smeemo': 0 },
      },
      {
        imageUrl: '/quiz-photos/quiz-img-3.png',
        alt: 'Bold and artistic aesthetic',
        scores: { Aaron: 0, Electra: 0, Madeleine: 2, 'Nosferatu/Smeemo': 0 },
      },
      {
        imageUrl: '/quiz-photos/quiz-img-4.png',
        alt: 'Dark and edgy aesthetic',
        scores: { Aaron: 0, Electra: 0, Madeleine: 0, 'Nosferatu/Smeemo': 2 },
      },
    ],
  },
  {
    id: 'img2',
    type: 'image-choice',
    question: 'Pick your ideal vacation spot:',
    options: [
      {
        imageUrl: '/quiz-photos/quiz-img-5.png',
        alt: 'Beach paradise',
        scores: { Aaron: 0, Electra: 2, Madeleine: 1, 'Nosferatu/Smeemo': 0 },
      },
      {
        imageUrl: '/quiz-photos/quiz-img-6.png',
        alt: 'Mountain retreat',
        scores: { Aaron: 2, Electra: 0, Madeleine: 0, 'Nosferatu/Smeemo': 0 },
      },
      {
        imageUrl: '/quiz-photos/quiz-img-7.png',
        alt: 'City adventure',
        scores: { Aaron: 0, Electra: 0, Madeleine: 2, 'Nosferatu/Smeemo': 0 },
      },
      {
        imageUrl: '/quiz-photos/quiz-img-8.png',
        alt: 'Remote cabin',
        scores: { Aaron: 1, Electra: 0, Madeleine: 0, 'Nosferatu/Smeemo': 2 },
      },
    ],
  },
  {
    id: 'img3',
    type: 'image-choice',
    question: 'Choose your spirit animal:',
    options: [
      {
        imageUrl: '/quiz-photos/quiz-img-9.png',
        alt: 'Butterfly',
        scores: { Aaron: 0, Electra: 2, Madeleine: 0, 'Nosferatu/Smeemo': 0 },
      },
      {
        imageUrl: '/quiz-photos/quiz-img-10.png',
        alt: 'Owl',
        scores: { Aaron: 2, Electra: 0, Madeleine: 0, 'Nosferatu/Smeemo': 0 },
      },
      {
        imageUrl: '/quiz-photos/quiz-img-11.png',
        alt: 'Lion',
        scores: { Aaron: 0, Electra: 0, Madeleine: 2, 'Nosferatu/Smeemo': 0 },
      },
      {
        imageUrl: '/quiz-photos/quiz-img-12.png',
        alt: 'Raven',
        scores: { Aaron: 0, Electra: 0, Madeleine: 0, 'Nosferatu/Smeemo': 2 },
      },
    ],
  },
];

export const characterDescriptions: Record<QuizCharacter, string> = {
  Electra: "You're vibrant, social, and full of energy! You light up every room you enter.",
  Aaron:
    "You're thoughtful, introspective, and value deep connections. You prefer quality over quantity.",
  Madeleine:
    "You're bold, confident, and love to stand out. You're not afraid to take the spotlight.",
  'Nosferatu/Smeemo':
    "You're mysterious, unique, and march to the beat of your own drum. You embrace the unconventional.",
};

export const neitherDescription =
  "You're a unique enigma! Your personality doesn't fit neatly into any of our boxes. You're truly one of a kind.";
