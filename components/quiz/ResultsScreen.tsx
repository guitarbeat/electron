import React from 'react';
import { QuizResult, QuizCharacter } from './types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { spacing, typography, colors, shadows } from '../../design-system/tokens';

interface ResultsScreenProps {
  result: QuizResult;
  onContinue: () => void;
  onRetake: () => void;
  characterDescriptions: Record<QuizCharacter, string>;
  neitherDescription: string;
}

const characterEmojis: Record<string, string> = {
  'Electra': '💖',
  'Aaron': '🦉',
  'Madeleine': '👑',
  'Nosferatu/Smeemo': '🦇',
  'Neither': '🤷',
};

const characterColors: Record<string, string> = {
  'Electra': colors.accent,
  'Aaron': colors.secondary,
  'Madeleine': colors.tertiary,
  'Nosferatu/Smeemo': colors.yellow,
  'Neither': colors.textSecondary,
};

const ResultsScreen: React.FC<ResultsScreenProps> = ({ 
  result, 
  onContinue, 
  onRetake,
  characterDescriptions,
  neitherDescription 
}) => {
  const characterColor = characterColors[result.character];
  const characterEmoji = characterEmojis[result.character];
  const description = result.character === 'Neither' 
    ? neitherDescription 
    : characterDescriptions[result.character as QuizCharacter];

  return (
    <div
      style={{
        maxWidth: '36rem',
        margin: '0 auto',
        textAlign: 'center',
      }}
      className="animate-fade-in"
    >
      <Card variant="elevated">
        <div style={{ padding: spacing['2xl'] }}>
          {/* Celebration emoji */}
          <div
            style={{
              fontSize: '5rem',
              marginBottom: spacing.lg,
              animation: 'bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.27, 1.55)',
            }}
          >
            {characterEmoji}
          </div>

          <h2
            style={{
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.medium,
              color: colors.textSecondary,
              marginBottom: spacing.md,
              marginTop: 0,
            }}
          >
            You are...
          </h2>

          <h1
            style={{
              fontSize: typography.fontSize['4xl'],
              fontWeight: typography.fontWeight.bold,
              color: characterColor,
              marginBottom: spacing.xl,
              marginTop: 0,
              textShadow: `0 2px 6px rgba(0, 0, 0, 0.5), 0 0 20px ${characterColor}80`,
              letterSpacing: '0.02em',
            }}
          >
            {result.character}
          </h1>

          <div
            style={{
              backgroundColor: `${characterColor}20`,
              border: `3px solid ${characterColor}`,
              borderRadius: '12px',
              padding: spacing.xl,
              marginBottom: spacing.xl,
              boxShadow: `0 0 20px ${characterColor}40`,
            }}
          >
            <p
              style={{
                fontSize: typography.fontSize.lg,
                color: colors.textPrimary,
                margin: 0,
                lineHeight: typography.lineHeight.relaxed,
              }}
            >
              {description}
            </p>
          </div>

          {/* Score breakdown */}
          <div
            style={{
              marginBottom: spacing.xl,
            }}
          >
            <h3
              style={{
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.semibold,
                color: colors.textSecondary,
                marginBottom: spacing.md,
                marginTop: 0,
              }}
            >
              Your Match Breakdown
            </h3>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: spacing.sm,
              }}
            >
              {(Object.keys(result.percentages) as QuizCharacter[])
                .sort((a, b) => result.percentages[b] - result.percentages[a])
                .map((char) => (
                  <div
                    key={char}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.md,
                    }}
                  >
                    <div
                      style={{
                        width: '120px',
                        textAlign: 'right',
                        fontSize: typography.fontSize.sm,
                        color: colors.textSecondary,
                        fontWeight: char === result.character ? typography.fontWeight.bold : typography.fontWeight.normal,
                      }}
                    >
                      {char}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        height: '24px',
                        backgroundColor: colors.surface,
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: `2px solid ${characterColors[char]}40`,
                      }}
                    >
                      <div
                        style={{
                          width: `${result.percentages[char]}%`,
                          height: '100%',
                          backgroundColor: characterColors[char],
                          transition: 'width 1s ease-out',
                          boxShadow: char === result.character ? `0 0 10px ${characterColors[char]}` : 'none',
                        }}
                        className="slide-up"
                      />
                    </div>
                    <div
                      style={{
                        width: '50px',
                        fontSize: typography.fontSize.sm,
                        color: colors.textPrimary,
                        fontWeight: char === result.character ? typography.fontWeight.bold : typography.fontWeight.normal,
                      }}
                    >
                      {result.percentages[char]}%
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.md,
            }}
          >
            <Button
              variant="primary"
              size="lg"
              onClick={onContinue}
              style={{
                width: '100%',
                fontSize: typography.fontSize.xl,
              }}
              aria-label="Continue to movie watchlist"
            >
              Continue to Watchlist →
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={onRetake}
              style={{
                width: '100%',
                fontSize: typography.fontSize.base,
              }}
              aria-label="Retake the quiz"
            >
              Retake Quiz
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ResultsScreen;
