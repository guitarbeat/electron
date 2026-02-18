import React from 'react';
import { User } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import SnakeGame from '../snake/SnakeGame';
import { colors, spacing, typography, radius } from '../../design-system/tokens';

interface ExtrasHubProps {
  currentUser: User | null;
  quizCompleted: boolean;
  onStartQuiz: () => void;
  onRetakeQuiz: () => void;
  onOpenQuizEditor: () => void;
}

const ExtrasHub: React.FC<ExtrasHubProps> = ({
  currentUser,
  quizCompleted,
  onStartQuiz,
  onRetakeQuiz,
  onOpenQuizEditor,
}) => {
  return (
    <div
      style={{
        maxWidth: '960px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.lg,
      }}
    >
      <Card
        style={{
          padding: spacing.lg,
          borderRadius: radius.lg,
          border: `1px solid ${colors.borderSecondary}35`,
          background:
            'radial-gradient(circle at 15% 0%, rgba(255, 105, 180, 0.22), rgba(255, 105, 180, 0)), linear-gradient(145deg, rgba(27, 40, 69, 0.86), rgba(18, 29, 54, 0.9))',
        }}
      >
        <h2
          style={{
            margin: 0,
            marginBottom: spacing.xs,
            color: colors.textPrimary,
            fontFamily: typography.fontFamily.heading.join(', '),
            fontSize: typography.fontSize.lg,
            letterSpacing: '0.03em',
          }}
        >
          Personality Quiz
        </h2>
        <p
          style={{
            margin: 0,
            marginBottom: spacing.md,
            color: colors.textSecondary,
            fontSize: typography.fontSize.sm,
          }}
        >
          {quizCompleted
            ? 'Retake the quiz any time to refresh your match.'
            : 'Take the quiz when you want. Your queue is still ready now.'}
        </p>
        <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
          <Button
            variant={quizCompleted ? 'ghost' : 'secondary'}
            size="sm"
            onClick={quizCompleted ? onRetakeQuiz : onStartQuiz}
          >
            {quizCompleted ? 'Retake Quiz' : 'Start Quiz'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenQuizEditor}
            disabled={!currentUser}
            style={{ border: `1px solid ${colors.borderSecondary}35` }}
          >
            {currentUser ? 'Open Quiz Editor' : 'Pick Aaron or Electra to edit quiz'}
          </Button>
        </div>
      </Card>

      <Card
        style={{
          padding: spacing.lg,
          borderRadius: radius.lg,
          border: `1px solid ${colors.borderSecondary}35`,
          background: 'linear-gradient(145deg, rgba(20, 31, 56, 0.88), rgba(12, 22, 41, 0.88))',
        }}
      >
        <h2
          style={{
            margin: 0,
            marginBottom: spacing.sm,
            color: colors.textPrimary,
            fontFamily: typography.fontFamily.heading.join(', '),
            fontSize: typography.fontSize.lg,
          }}
        >
          Snake Arcade
        </h2>
        <p
          style={{
            margin: 0,
            marginBottom: spacing.md,
            color: colors.textSecondary,
            fontSize: typography.fontSize.sm,
          }}
        >
          Embedded mode for quick breaks between picks.
        </p>

        <SnakeGame mode="embedded" />
      </Card>
    </div>
  );
};

export default ExtrasHub;
