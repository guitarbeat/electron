import React, { useState } from 'react';
import { User } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import SnakeGame from '../snake/SnakeGame';
import Matchmaker from '../matchmaker/Matchmaker';
import SpinWheel from '../extras/spin-wheel/SpinWheel';
import { useMovies } from '../../hooks/useMovies';
import { DiceIcon } from '../common/icons';
import { colors, spacing, typography, radius, shadows } from '../../design-system/tokens';

/** Shared card style for all extras sections (spin, games, quiz) */
const sectionStyle: React.CSSProperties = {
  padding: spacing.lg,
  borderRadius: radius.lg,
  border: `1px solid ${colors.borderSecondary}35`,
  background: `linear-gradient(145deg, ${colors.surfaceElevated}, ${colors.surface})`,
  boxShadow: shadows.glow,
};

/** Shared section heading */
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
          <Card
            style={{
              ...sectionStyle,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: spacing.md,
            }}
          >
            <div>
              <h2 style={{ ...sectionTitleStyle, marginBottom: spacing.xs }}>Spin</h2>
              <p style={sectionSubtitleStyle}>
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
                minWidth: 140,
                border: canSpin ? undefined : `1px solid ${colors.borderSecondary}40`,
              }}
            >
              <DiceIcon />
              {canSpin ? 'Spin' : 'Locked'}
            </Button>
          </Card>
          <SpinWheel
            isOpen={isWheelVisible}
            movies={unwatchedMovies}
            onClose={() => setIsWheelVisible(false)}
            onWinner={(m) => console.log('Winner:', m.title)}
          />
        </>
      )}

      {showGames && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
          <Card style={sectionStyle}>
            <h2 style={{ ...sectionTitleStyle, marginBottom: spacing.md }}>Matchmaker</h2>
            <Matchmaker currentUser={currentUser} />
          </Card>
          <Card style={{ ...sectionStyle, overflow: 'visible', overflowY: 'visible' }}>
            <h2 style={{ ...sectionTitleStyle, marginBottom: spacing.sm }}>Snake</h2>
            <p style={{ ...sectionSubtitleStyle, marginBottom: spacing.md }}>
              Quick break between picks.
            </p>
            <SnakeGame mode="embedded" />
          </Card>
        </div>
      )}

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
