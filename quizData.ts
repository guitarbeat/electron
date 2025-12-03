/**
 * Quiz Data
 * 
 * Placeholder quiz questions and character descriptions
 * USER WILL REPLACE THESE WITH ACTUAL CONTENT
 */

import { QuizQuestion, QuizCharacter } from './quizTypes';

export const quizQuestions: QuizQuestion[] = [
    // Multiple Choice Questions (3)
    {
        id: 'mc1',
        type: 'multiple-choice',
        question: 'What\'s your ideal Friday night?',
        options: [
            { text: 'Watching movies at home', scores: { 'Aaron': 2, 'Electra': 1 } },
            { text: 'Going out to a party', scores: { 'Madeleine': 2, 'Nosferatu/Smeemo': 1 } },
            { text: 'Reading a book alone', scores: { 'Aaron': 1, 'Nosferatu/Smeemo': 2 } },
            { text: 'Hanging with close friends', scores: { 'Electra': 2, 'Madeleine': 1 } },
        ],
    },
    {
        id: 'mc2',
        type: 'multiple-choice',
        question: 'Pick your favorite color palette:',
        options: [
            { text: 'Warm and vibrant', scores: { 'Electra': 2 } },
            { text: 'Cool and calming', scores: { 'Aaron': 2 } },
            { text: 'Bold and dramatic', scores: { 'Madeleine': 2 } },
            { text: 'Dark and mysterious', scores: { 'Nosferatu/Smeemo': 2 } },
        ],
    },
    {
        id: 'mc3',
        type: 'multiple-choice',
        question: 'How do you handle stress?',
        options: [
            { text: 'Talk it out with friends', scores: { 'Electra': 2, 'Madeleine': 1 } },
            { text: 'Process it internally', scores: { 'Aaron': 2, 'Nosferatu/Smeemo': 1 } },
            { text: 'Distract myself with activities', scores: { 'Madeleine': 2 } },
            { text: 'Embrace the chaos', scores: { 'Nosferatu/Smeemo': 2 } },
        ],
    },

    // Agree/Disagree Questions (3)
    {
        id: 'ad1',
        type: 'agree-disagree',
        question: 'I prefer spontaneity over planning.',
        scores: {
            stronglyDisagree: { 'Aaron': 2 },
            disagree: { 'Aaron': 1, 'Electra': 1 },
            neutral: { 'Madeleine': 1 },
            agree: { 'Electra': 1, 'Nosferatu/Smeemo': 1 },
            stronglyAgree: { 'Nosferatu/Smeemo': 2 },
        },
    },
    {
        id: 'ad2',
        type: 'agree-disagree',
        question: 'I\'m more of a night owl than an early bird.',
        scores: {
            stronglyDisagree: { 'Aaron': 2 },
            disagree: { 'Aaron': 1 },
            neutral: { 'Electra': 1, 'Madeleine': 1 },
            agree: { 'Nosferatu/Smeemo': 1 },
            stronglyAgree: { 'Nosferatu/Smeemo': 2 },
        },
    },
    {
        id: 'ad3',
        type: 'agree-disagree',
        question: 'I enjoy being the center of attention.',
        scores: {
            stronglyDisagree: { 'Aaron': 2, 'Nosferatu/Smeemo': 1 },
            disagree: { 'Aaron': 1 },
            neutral: { 'Electra': 1 },
            agree: { 'Madeleine': 1, 'Electra': 1 },
            stronglyAgree: { 'Madeleine': 2 },
        },
    },

    // Image Choice Questions (3)
    {
        id: 'img1',
        type: 'image-choice',
        question: 'Which aesthetic speaks to you?',
        options: [
            {
                imageUrl: 'https://via.placeholder.com/300x200/ff69b4/ffffff?text=Vibrant+%26+Fun',
                alt: 'Vibrant and fun aesthetic',
                scores: { 'Electra': 2 }
            },
            {
                imageUrl: 'https://via.placeholder.com/300x200/87cefa/ffffff?text=Calm+%26+Serene',
                alt: 'Calm and serene aesthetic',
                scores: { 'Aaron': 2 }
            },
            {
                imageUrl: 'https://via.placeholder.com/300x200/9370db/ffffff?text=Bold+%26+Artistic',
                alt: 'Bold and artistic aesthetic',
                scores: { 'Madeleine': 2 }
            },
            {
                imageUrl: 'https://via.placeholder.com/300x200/1a1a2e/ffffff?text=Dark+%26+Edgy',
                alt: 'Dark and edgy aesthetic',
                scores: { 'Nosferatu/Smeemo': 2 }
            },
        ],
    },
    {
        id: 'img2',
        type: 'image-choice',
        question: 'Pick your ideal vacation spot:',
        options: [
            {
                imageUrl: 'https://via.placeholder.com/300x200/ffeb3b/000000?text=Beach+Paradise',
                alt: 'Beach paradise',
                scores: { 'Electra': 2, 'Madeleine': 1 }
            },
            {
                imageUrl: 'https://via.placeholder.com/300x200/4ade80/ffffff?text=Mountain+Retreat',
                alt: 'Mountain retreat',
                scores: { 'Aaron': 2 }
            },
            {
                imageUrl: 'https://via.placeholder.com/300x200/f87171/ffffff?text=City+Adventure',
                alt: 'City adventure',
                scores: { 'Madeleine': 2 }
            },
            {
                imageUrl: 'https://via.placeholder.com/300x200/374151/ffffff?text=Remote+Cabin',
                alt: 'Remote cabin',
                scores: { 'Nosferatu/Smeemo': 2, 'Aaron': 1 }
            },
        ],
    },
    {
        id: 'img3',
        type: 'image-choice',
        question: 'Choose your spirit animal:',
        options: [
            {
                imageUrl: 'https://via.placeholder.com/300x200/ff69b4/ffffff?text=Butterfly',
                alt: 'Butterfly',
                scores: { 'Electra': 2 }
            },
            {
                imageUrl: 'https://via.placeholder.com/300x200/87cefa/ffffff?text=Owl',
                alt: 'Owl',
                scores: { 'Aaron': 2 }
            },
            {
                imageUrl: 'https://via.placeholder.com/300x200/9370db/ffffff?text=Lion',
                alt: 'Lion',
                scores: { 'Madeleine': 2 }
            },
            {
                imageUrl: 'https://via.placeholder.com/300x200/1a1a2e/ffffff?text=Raven',
                alt: 'Raven',
                scores: { 'Nosferatu/Smeemo': 2 }
            },
        ],
    },
];

export const characterDescriptions: Record<QuizCharacter, string> = {
    'Electra': 'You\'re vibrant, social, and full of energy! You light up every room you enter.',
    'Aaron': 'You\'re thoughtful, introspective, and value deep connections. You prefer quality over quantity.',
    'Madeleine': 'You\'re bold, confident, and love to stand out. You\'re not afraid to take the spotlight.',
    'Nosferatu/Smeemo': 'You\'re mysterious, unique, and march to the beat of your own drum. You embrace the unconventional.',
};
