import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { spacing, typography, colors, shadows } from '../../design-system/tokens';

interface IntroScreenProps {
  onStartQuiz: () => void;
  onSkip: () => void;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onStartQuiz, onSkip }) => {
  return (
    <div
      style={{
        maxWidth: '32rem',
        margin: '0 auto',
        textAlign: 'center',
      }}
      className="animate-fade-in"
    >
      <Card variant="elevated">
        <div style={{ padding: spacing['2xl'] }}>
          {/* Decorative sparkle effect */}
          <div
            style={{
              fontSize: '4rem',
              marginBottom: spacing.lg,
              animation: 'float 3s ease-in-out infinite',
            }}
          >
            ✨
          </div>

          <h1
            style={{
              fontSize: typography.fontSize['3xl'],
              fontWeight: typography.fontWeight.bold,
              color: colors.accent,
              background: shadows.textGradientPink,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: spacing.lg,
              marginTop: 0,
              textShadow: '0 2px 6px rgba(0, 0, 0, 0.5), 0 0 16px rgba(255, 105, 180, 0.3)',
              letterSpacing: '0.02em',
              filter: 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.6))',
            }}
          >
            Personality Quiz
          </h1>

          <p
            style={{
              fontSize: typography.fontSize.lg,
              color: colors.textSecondary,
              marginBottom: spacing.xl,
              marginTop: 0,
              lineHeight: typography.lineHeight.relaxed,
            }}
          >
            Discover which character you are!
          </p>

          <div
            style={{
              backgroundColor: 'rgba(255, 105, 180, 0.1)',
              border: `2px solid ${colors.accent}`,
              borderRadius: '8px',
              padding: spacing.lg,
              marginBottom: spacing.xl,
            }}
          >
            <p
              style={{
                fontSize: typography.fontSize.base,
                color: colors.textPrimary,
                margin: 0,
                lineHeight: typography.lineHeight.relaxed,
              }}
            >
              Answer 9 fun questions to find out if you're <strong style={{ color: colors.accent }}>Electra</strong>, <strong style={{ color: colors.secondary }}>Aaron</strong>, <strong style={{ color: colors.tertiary }}>Madeleine</strong>, or <strong style={{ color: colors.yellow }}>Nosferatu/Smeemo</strong>!
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.lg,
            }}
          >
            <Button
              variant="primary"
              size="lg"
              onClick={onStartQuiz}
              style={{
                width: '100%',
                fontSize: typography.fontSize.xl,
              }}
              aria-label="Start the personality quiz"
            >
              Take the Quiz ✨
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={onSkip}
              style={{
                width: '100%',
                fontSize: typography.fontSize.base,
              }}
              aria-label="Skip quiz and go to user selection"
            >
              Skip for Now
            </Button>
          </div>

          <p
            style={{
              fontSize: typography.fontSize.sm,
              color: colors.textTertiary,
              marginTop: spacing.lg,
              marginBottom: 0,
            }}
          >
            Takes about 2 minutes
          </p>
        </div>
      </Card>
    </div>
  );
};

export default IntroScreen;
