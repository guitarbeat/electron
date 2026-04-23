import React, { useState, useEffect } from 'react';
import { QuizResult, QuizCharacter } from './lib/types';
import BlinkText from './BlinkText';

interface ResultsScreenProps {
  result: QuizResult;
  onContinue: () => void;
  onRetake: () => void;
  onEdit?: () => void;
  characterDescriptions: Record<QuizCharacter, string>;
  neitherDescription: string;
}

const characterEmojis: Record<string, string> = {
  Electra: '💖',
  Aaron: '🦉',
  Madeleine: '👑',
  'Nosferatu/Smeemo': '🦇',
  Neither: '🤷',
};

const characterColors: Record<string, string> = {
  Electra: '#ff69b4',
  Aaron: '#00bfff',
  Madeleine: '#ffd700',
  'Nosferatu/Smeemo': '#9400d3',
  Neither: '#888888',
};

const RESULT_NAME_STYLE = { fontSize: '26px' } as const;
const RESULT_DESCRIPTION_STYLE = (characterColor: string) =>
  ({
    background: `${characterColor}22`,
    border: `3px solid ${characterColor}`,
    padding: '8px',
    marginBottom: '12px',
  }) satisfies React.CSSProperties;
const ACTION_BUTTON_STACK_STYLE = { display: 'flex', flexDirection: 'column', gap: 6 } as const;
const PRIMARY_ACTION_STYLE = { width: '100%', fontSize: '14px' } as const;
const SECONDARY_ACTION_STYLE = { width: '100%' } as const;
const EDIT_ACTION_STYLE = { width: '100%', fontSize: '12px', opacity: 0.85 } as const;

const getResultDescription = (
  result: QuizResult,
  characterDescriptions: Record<QuizCharacter, string>,
  neitherDescription: string
) =>
  result.character === 'Neither'
    ? neitherDescription
    : (characterDescriptions[result.character as QuizCharacter] ?? `You got ${result.character}!`);

const ResultsScreen: React.FC<ResultsScreenProps> = ({
  result,
  onContinue,
  onRetake,
  onEdit,
  characterDescriptions,
  neitherDescription,
}) => {
  const [starAngle, setStarAngle] = useState(0);
  const characterColor = characterColors[result.character] || '#888888';
  const characterEmoji = characterEmojis[result.character] || '🤷';
  const description = getResultDescription(result, characterDescriptions, neitherDescription);

  useEffect(() => {
    const id = setInterval(() => setStarAngle(a => (a + 8) % 360), 40);
    return () => clearInterval(id);
  }, []);

  const sortedChars = (Object.keys(result.percentages) as QuizCharacter[])
    .sort((a, b) => result.percentages[b] - result.percentages[a]);

  return (
    <div className="quiz-retro-wrapper">
      {/* Top marquee */}
      <div className="quiz-retro-marquee-bar">
        <span className="quiz-retro-marquee-inner">
          🎉 CONGRATULATIONS!!! YOUR RESULTS ARE IN!!! 🎉 SHARE WITH YOUR FRIENDS!!! 🎉 YOU ARE AMAZING!!! 🎉
        </span>
      </div>

      <div className="quiz-retro-rainbow-border">
        <div className="quiz-retro-header-bar">
          <span>★ YOUR OFFICIAL PERSONALITY RESULTS - CERTIFIED 100% ACCURATE!!! ★</span>
        </div>
      </div>

      <div className="quiz-retro-main">
        {/* Win banner */}
        <div className="quiz-retro-results-win">
          <span
            className="quiz-retro-results-star"
            style={{ transform: `rotate(${starAngle}deg)`, display: 'inline-block', fontSize: 36 }}
          >
            ⭐
          </span>
          <div>
            <BlinkText style={{ fontSize: '18px' }}>CONGRATULATIONS!!!</BlinkText>
          </div>
          <div className="quiz-retro-results-sub">YOUR RESULTS ARE IN!!!</div>
        </div>

        {/* Results body */}
        <div className="quiz-retro-results-body">
          <div className="quiz-retro-results-sci">
            🔬 SCIENTIFIC ANALYSIS COMPLETE!!! 🔬
          </div>
          <div className="quiz-retro-results-you-are">YOU ARE...</div>
          <div
            className="quiz-retro-results-name"
            style={{ ...RESULT_NAME_STYLE, color: characterColor }}
          >
            {characterEmoji} {result.character.toUpperCase()}!!!
          </div>

          <div style={RESULT_DESCRIPTION_STYLE(characterColor)}>
            <p className="quiz-retro-results-desc">{description}</p>
          </div>

          {/* Score breakdown */}
          <div style={{ marginBottom: '12px' }}>
            <div className="quiz-retro-results-breakdown-title">
              📊 YOUR MATCH BREAKDOWN (100% ACCURATE!!!):
            </div>
            {sortedChars.map((char) => {
              const isWinner = char === result.character;
              const pct = result.percentages[char];
              const color = characterColors[char] || '#888888';
              return (
                <div key={char} className="quiz-retro-results-bar-row">
                  <div
                    className="quiz-retro-results-bar-label"
                    style={{
                      fontWeight: isWinner ? 'bold' : 'normal',
                      color: isWinner ? color : '#444444',
                    }}
                  >
                    {characterEmojis[char]} {char}
                  </div>
                  <div className="quiz-retro-results-bar-track">
                    <div
                      className="quiz-retro-results-bar-fill"
                      style={{
                        width: `${pct}%`,
                        background: color,
                        boxShadow: isWinner ? `0 0 6px ${color}` : 'none',
                      }}
                    />
                  </div>
                  <div
                    className="quiz-retro-results-bar-pct"
                    style={{
                      fontWeight: isWinner ? 'bold' : 'normal',
                      color: isWinner ? color : '#444444',
                    }}
                  >
                    {pct}%
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div style={ACTION_BUTTON_STACK_STYLE}>
            <button
              className="quiz-retro-btn"
              onClick={onContinue}
              style={PRIMARY_ACTION_STYLE}
              aria-label="Continue to movie watchlist"
            >
              {'🎬 CONTINUE TO WATCHLIST >>>'}
            </button>
            <button
              className="quiz-retro-btn quiz-retro-btn--secondary"
              onClick={onRetake}
              style={SECONDARY_ACTION_STYLE}
              aria-label="Retake the quiz"
            >
              🔄 RETAKE QUIZ - GET NEW RESULTS!!!
            </button>
            {onEdit && (
              <button
                className="quiz-retro-btn quiz-retro-btn--secondary"
                onClick={onEdit}
                style={EDIT_ACTION_STYLE}
                aria-label="Edit quiz questions"
              >
                ✏️ EDIT QUIZ QUESTIONS
              </button>
            )}
          </div>
        </div>

        {/* Share strip */}
        <div className="quiz-retro-results-share">
          <BlinkText style={{ fontSize: '13px' }}>
            *** SHARE YOUR RESULTS WITH FRIENDS!!! ***
          </BlinkText>
          <p>THEY NEED TO KNOW YOUR TRUE PERSONALITY!!!</p>
        </div>
      </div>

      <div className="quiz-retro-marquee-bar" style={{ marginTop: 4, marginBottom: 0 }}>
        <span className="quiz-retro-marquee-inner" style={{ animationDelay: '-5s' }}>
          🌟 AMAZING RESULTS!!! TELL EVERYONE!!! 🌟 YOU ARE TRULY SPECIAL!!! 🌟 TAKE THE QUIZ AGAIN FOR MORE FUN!!! 🌟
        </span>
      </div>
    </div>
  );
};

export default ResultsScreen;
