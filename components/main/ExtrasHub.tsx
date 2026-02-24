import React, { useState } from 'react';
import { User } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import SnakeGame from '../snake/SnakeGame';
import Matchmaker from '../matchmaker/Matchmaker';
import SpinWheel from '../extras/spin-wheel/SpinWheel';
import { useMovies } from '../../hooks/useMovies';
import { DiceIcon } from '../icons';
import { colors, spacing, typography, radius, shadows } from '../../design-system/tokens';

interface ExtrasHubProps {
  currentUser: User | null;
  quizCompleted: boolean;
  onStartQuiz: () => void;
  onRetakeQuiz: () => void;
  onOpenQuizEditor: () => void;
  initialView?: 'games' | 'quiz' | 'spin' | 'all';
}

const ExtrasHub: React.FC<ExtrasHubProps> = ({
  currentUser,
  quizCompleted,
  onStartQuiz,
  onRetakeQuiz,
  onOpenQuizEditor,
  initialView = 'all',
}) => {
  const [isWheelVisible, setIsWheelVisible] = useState(initialView === 'spin');
  const { movies } = useMovies(currentUser);

  const unwatchedMovies = movies ? movies.filter((movie) => movie.watchedBy.length < 2) : [];
  const moviesNeededForSpin = Math.max(0, 2 - unwatchedMovies.length);
  const canSpin = Boolean(currentUser) && moviesNeededForSpin === 0;

  const showSpin = initialView === 'all' || initialView === 'spin';
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
      {showSpin && (
        <>
          {/* Spin Wheel Card */}
          <Card
            style={{
              padding: spacing.lg,
              borderRadius: radius.lg,
              border: `1px solid ${colors.borderSecondary}35`,
              background:
                'linear-gradient(135deg, rgba(80, 28, 66, 0.96) 0%, rgba(53, 21, 74, 0.92) 100%)',
              boxShadow: shadows.glowStrong,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: spacing.md,
            }}
          >
            <div>
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
                Movie Spin Wheel
              </h2>
              <p
                style={{
                  margin: 0,
                  color: colors.textSecondary,
                  fontSize: typography.fontSize.sm,
                }}
              >
                {canSpin
                  ? 'Ready to spin!'
                  : `Add ${moviesNeededForSpin} more unwatched ${moviesNeededForSpin === 1 ? 'movie' : 'movies'} to spin.`}
              </p>
            </div>
            <Button
              variant={canSpin ? 'secondary' : 'ghost'}
              onClick={() => setIsWheelVisible(true)}
              disabled={!canSpin}
              style={{
                minWidth: '160px',
                border: canSpin ? undefined : `1px solid ${colors.borderSecondary}40`,
              }}
            >
              <DiceIcon />
              {canSpin ? 'Spin the Wheel' : 'Locked'}
            </Button>
          </Card>

          <SpinWheel
            isOpen={isWheelVisible}
            movies={unwatchedMovies}
            onClose={() => setIsWheelVisible(false)}
            onWinner={(movie) => console.log('Winner:', movie.title)}
          />
        </>
      )}

      {showGames && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
          {/* Matchmaker Game */}
          <Card
            style={{
              padding: spacing.lg,
              borderRadius: radius.lg,
              border: `1px solid ${colors.borderTertiary}35`,
              background:
                'linear-gradient(145deg, rgba(30, 20, 50, 0.88), rgba(20, 10, 40, 0.88))',
              boxShadow: shadows.glow,
            }}
          >
            <Matchmaker currentUser={currentUser} />
          </Card>

          {/* Snake Arcade */}
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
      )}

      {showQuiz && (
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
      )}
    </div>
  );
};

export default ExtrasHub;
