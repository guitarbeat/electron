import React from 'react';
import { User } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { colors, spacing, typography, radius, shadows } from '../../design-system/tokens';

/** Shared card style for all extras sections */
const sectionStyle: React.CSSProperties = {
  padding: spacing.lg,
  borderRadius: radius.lg,
  border: `1px solid ${colors.borderSecondary}35`,
  background: `linear-gradient(145deg, ${colors.surfaceElevated}, ${colors.surface})`,
  boxShadow: shadows.glow,
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  color: colors.textPrimary,
  fontFamily: typography.fontFamily.heading.join(', '),
  fontSize: typography.fontSize.lg,
  letterSpacing: '0.03em',
};

const sectionSubtitleStyle: React.CSSProperties = {
  margin: 0,
  color: colors.textSecondary,
  fontSize: typography.fontSize.sm,
};

interface ExtrasHubProps {
  currentUser: User | null;
  quizCompleted: boolean;
  onStartQuiz: () => void;
  onRetakeQuiz: () => void;
  onOpenQuizEditor: () => void;
  initialView?: 'games' | 'quiz' | 'all';
}

const ExtrasHub: React.FC<ExtrasHubProps> = ({
  currentUser,
  quizCompleted,
  onStartQuiz,
  onRetakeQuiz,
  onOpenQuizEditor,
  initialView = 'all',
}) => {
  const showGames = initialView === 'all' || initialView === 'games';
  const showQuiz = initialView === 'all' || initialView === 'quiz';

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

      {showQuiz && (
        <Card style={sectionStyle}>
          <h2 style={{ ...sectionTitleStyle, marginBottom: spacing.xs }}>Quiz</h2>
          <p style={{ ...sectionSubtitleStyle, marginBottom: spacing.md }}>
            {quizCompleted
              ? 'Retake any time to refresh your match.'
              : 'Take when you want—queue is ready now.'}
          </p>
          <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
            <Button
              variant={quizCompleted ? 'ghost' : 'secondary'}
              size="sm"
              onClick={quizCompleted ? onRetakeQuiz : onStartQuiz}
            >
              {quizCompleted ? 'Retake' : 'Start Quiz'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenQuizEditor}
              disabled={!currentUser}
              style={{ border: `1px solid ${colors.borderSecondary}35` }}
            >
              {currentUser ? 'Edit Quiz' : 'Pick user to edit'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ExtrasHub;
