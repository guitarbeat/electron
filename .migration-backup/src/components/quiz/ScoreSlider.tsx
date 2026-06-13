/**
 * ScoreSlider Component
 *
 * Visual slider-based score editor with quick assign shortcuts
 */

import React from 'react';
import { QuizCharacter } from './lib/types';
import { spacing, colors, typography, radius } from '@/theme/tokens';

interface ScoreSliderProps {
  scores: Partial<Record<QuizCharacter, number>>;
  onChange: (scores: Partial<Record<QuizCharacter, number>>) => void;
  maxScore?: number;
  compact?: boolean;
}

const CHARACTERS: QuizCharacter[] = ['Aaron', 'Electra', 'Madeleine', 'Nosferatu/Smeemo'];

const CHARACTER_COLORS: Record<QuizCharacter, string> = {
  Aaron: '#87cefa', // Light Sky Blue
  Electra: '#ff69b4', // Hot Pink
  Madeleine: '#9370db', // Medium Purple
  'Nosferatu/Smeemo': '#4ade80', // Green
};

const CHARACTER_INITIALS: Record<QuizCharacter, string> = {
  Aaron: 'A',
  Electra: 'E',
  Madeleine: 'M',
  'Nosferatu/Smeemo': 'N',
};

const ScoreSlider: React.FC<ScoreSliderProps> = ({
  scores,
  onChange,
  maxScore = 5,
  compact = false,
}) => {
  const [showFineTune, setShowFineTune] = React.useState(!compact);
  const totalScore = Object.values(scores).reduce<number>(
    (sum, val) => sum + ((val as number) || 0),
    0
  );
  const dominantCharacter = CHARACTERS.reduce<QuizCharacter | null>((winner, char) => {
    const current = scores[char] ?? 0;
    if (!winner) return current > 0 ? char : null;
    return current > (scores[winner] ?? 0) ? char : winner;
  }, null);
  const weightedCharacters = CHARACTERS.filter((char) => (scores[char] ?? 0) > 0);
  const summaryText = !dominantCharacter
    ? 'No character assigned'
    : weightedCharacters.length === 1
      ? `Primary: ${dominantCharacter}`
      : `${weightedCharacters.length} characters weighted`;

  const updateScore = (character: QuizCharacter, value: number) => {
    onChange({ ...scores, [character]: Math.max(0, Math.min(maxScore, value)) });
  };

  const clearAll = () => {
    const cleared: Partial<Record<QuizCharacter, number>> = {};
    CHARACTERS.forEach((char) => (cleared[char] = 0));
    onChange(cleared);
  };

  const balanceEvenly = () => {
    const balanced: Partial<Record<QuizCharacter, number>> = {};
    CHARACTERS.forEach((char) => (balanced[char] = 1));
    onChange(balanced);
  };

  const assignStrong = (character: QuizCharacter) => {
    const assigned: Partial<Record<QuizCharacter, number>> = {};
    CHARACTERS.forEach((char) => (assigned[char] = char === character ? Math.min(maxScore, 3) : 0));
    onChange(assigned);
  };

  return (
    <div
      style={{
        backgroundColor: 'rgba(0,0,0,0.15)',
        borderRadius: radius.md,
        padding: spacing.sm,
        border: `1px solid ${colors.borderSecondary}10`,
      }}
    >
      {/* Quick Assign Bar */}
      <div
        style={{
          display: 'flex',
          gap: spacing.xs,
          marginBottom: spacing.sm,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            color: colors.textTertiary,
            ...typography.presets.eyebrow,
          }}
        >
          Quick:
        </span>
        {CHARACTERS.map((char) => (
          <button
            type="button"
            key={char}
            onClick={() => assignStrong(char)}
            title={`Assign to ${char}`}
            style={{
              padding: '3px 8px',
              fontSize: typography.fontSize['2xs'],
              fontWeight: typography.fontWeight.bold,
              backgroundColor: `${CHARACTER_COLORS[char]}20`,
              color: CHARACTER_COLORS[char],
              border: `1px solid ${CHARACTER_COLORS[char]}40`,
              borderRadius: radius.full,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              lineHeight: typography.lineHeight.none,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${CHARACTER_COLORS[char]}40`;
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = `${CHARACTER_COLORS[char]}20`;
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {CHARACTER_INITIALS[char]}
          </button>
        ))}
        {compact && (
          <>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: typography.fontSize.xs,
                color: colors.textTertiary,
              }}
            >
              {summaryText}
            </span>
            <button
              type="button"
              onClick={() => setShowFineTune(!showFineTune)}
              style={{
                padding: '3px 8px',
                fontSize: typography.fontSize['2xs'],
                backgroundColor: 'transparent',
                color: colors.textSecondary,
                border: `1px solid ${colors.borderSecondary}30`,
                borderRadius: radius.full,
                cursor: 'pointer',
                lineHeight: typography.lineHeight.none,
              }}
            >
              {showFineTune ? 'Hide fine-tune' : 'Fine-tune'}
            </button>
          </>
        )}
      </div>

      {/* Sliders */}
      {(!compact || showFineTune) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
          {CHARACTERS.map((char) => {
            const value = scores[char] ?? 0;
            const percentage = (value / maxScore) * 100;

            return (
              <div
                key={char}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                }}
              >
                {/* Character initial */}
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: radius.full,
                    backgroundColor: CHARACTER_COLORS[char],
                    color: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: typography.fontSize['2xs'],
                    fontWeight: typography.fontWeight.bold,
                    lineHeight: typography.lineHeight.none,
                    flexShrink: 0,
                  }}
                  title={char}
                >
                  {CHARACTER_INITIALS[char]}
                </div>

                {/* Slider container */}
                <div
                  style={{
                    flex: 1,
                    height: '24px',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    borderRadius: radius.full,
                    position: 'relative',
                    cursor: 'pointer',
                    overflow: 'hidden',
                  }}
                >
                  {/* Filled portion */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      height: '100%',
                      width: `${percentage}%`,
                      background: `linear-gradient(90deg, ${CHARACTER_COLORS[char]}80, ${CHARACTER_COLORS[char]})`,
                      borderRadius: radius.full,
                      transition: 'width 0.15s ease',
                    }}
                  />

                  {/* Tick marks */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '0 2px',
                      pointerEvents: 'none',
                    }}
                  >
                    {Array.from({ length: maxScore + 1 }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          width: '1px',
                          height: '100%',
                          backgroundColor: 'rgba(255,255,255,0.15)',
                        }}
                      />
                    ))}
                  </div>

                  {/* Range input for accessibility */}
                  <input
                    type="range"
                    min={0}
                    max={maxScore}
                    value={value}
                    onChange={(e) => updateScore(char, parseInt(e.target.value, 10))}
                    aria-label={`Score for ${char}`}
                    aria-valuetext={`${value} out of ${maxScore}`}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0,
                      cursor: 'pointer',
                      margin: 0,
                    }}
                  />
                </div>

                {/* Value display */}
                <div
                  style={{
                    width: '24px',
                    textAlign: 'center',
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.bold,
                    color: value > 0 ? CHARACTER_COLORS[char] : colors.textTertiary,
                  }}
                >
                  {value}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: spacing.sm,
          paddingTop: spacing.xs,
          borderTop: `1px solid ${colors.borderSecondary}10`,
        }}
      >
        <span
          style={{
            fontSize: typography.fontSize['2xs'],
            color: colors.textTertiary,
          }}
        >
          Total: {totalScore} pts
        </span>
        <div style={{ display: 'flex', gap: spacing.xs }}>
          <button
            type="button"
            onClick={clearAll}
            style={{
              padding: '2px 8px',
              fontSize: typography.fontSize['3xs'],
              backgroundColor: 'transparent',
              color: colors.textTertiary,
              border: `1px solid ${colors.borderSecondary}20`,
              borderRadius: radius.sm,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              lineHeight: typography.lineHeight.none,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Clear
          </button>
          <button
            type="button"
            onClick={balanceEvenly}
            style={{
              padding: '2px 8px',
              fontSize: typography.fontSize['3xs'],
              backgroundColor: 'transparent',
              color: colors.textTertiary,
              border: `1px solid ${colors.borderSecondary}20`,
              borderRadius: radius.sm,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              lineHeight: typography.lineHeight.none,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Balance
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScoreSlider;
