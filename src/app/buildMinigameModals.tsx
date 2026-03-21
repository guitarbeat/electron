import type { CSSProperties, ReactNode } from 'react';
import SnakeGame from '@/components/SnakeGame';
import SpinWheelGame from '@/components/SpinWheelGame';
import Matchmaker from '@/components/matchmaker/Matchmaker';
import QuizEditor from '@/components/quiz/QuizEditor';
import QuizFlow from '@/components/quiz/QuizFlow';
import type { QuizData } from '@/hooks/useQuiz';
import type { User } from '@/types';
import { colors, spacing } from '@/design-system';

export interface AppModalConfig {
  key: string;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  ariaLabel: string;
  maxWidth: number;
  maxHeight: number;
  closeDisabled?: boolean;
  closeDisabledLabel?: string;
  content: ReactNode;
  contentStyle?: CSSProperties;
}

const paddedScrollContentStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: spacing.lg,
};

export interface BuildFeatureModalsParams {
  showQuizEditor: boolean;
  showQuizFlow: boolean;
  showSpinWheel: boolean;
  showSnake: boolean;
  showMatchmaker: boolean;
  quizCompleted: boolean;
  isSpinWheelLocked: boolean;
  quizData: QuizData | null | undefined;
  currentUser: User | null;
  setShowQuizEditor: (open: boolean) => void;
  setShowQuizFlow: (open: boolean) => void;
  setShowSpinWheel: (open: boolean) => void;
  setShowSnake: (open: boolean) => void;
  setShowMatchmaker: (open: boolean) => void;
  setIsSpinWheelLocked: (locked: boolean) => void;
  onQuizComplete: () => void;
}

export function buildFeatureModals(params: BuildFeatureModalsParams): AppModalConfig[] {
  const {
    showQuizEditor,
    showQuizFlow,
    showSpinWheel,
    showSnake,
    showMatchmaker,
    quizCompleted,
    isSpinWheelLocked,
    quizData,
    currentUser,
    setShowQuizEditor,
    setShowQuizFlow,
    setShowSpinWheel,
    setShowSnake,
    setShowMatchmaker,
    setIsSpinWheelLocked,
    onQuizComplete,
  } = params;

  return [
    {
      key: 'quiz-editor',
      isOpen: showQuizEditor,
      onClose: () => setShowQuizEditor(false),
      title: 'Quiz Editor',
      ariaLabel: 'Quiz editor',
      maxWidth: 1200,
      maxHeight: 900,
      content: <QuizEditor onClose={() => setShowQuizEditor(false)} />,
    },
    {
      key: 'snake',
      isOpen: showSnake,
      onClose: () => setShowSnake(false),
      title: 'Snake',
      ariaLabel: 'Snake game',
      maxWidth: 760,
      maxHeight: 860,
      content: <SnakeGame />,
    },
    {
      key: 'spin-wheel',
      isOpen: showSpinWheel,
      onClose: () => setShowSpinWheel(false),
      title: 'Spin Wheel',
      ariaLabel: 'Spin wheel picker',
      maxWidth: 680,
      maxHeight: 860,
      closeDisabled: isSpinWheelLocked,
      closeDisabledLabel: 'Finish the current spin before closing the wheel.',
      content: <SpinWheelGame onSpinningChange={setIsSpinWheelLocked} />,
    },
    {
      key: 'quiz-flow',
      isOpen: showQuizFlow,
      onClose: () => setShowQuizFlow(false),
      title: quizCompleted ? 'Retake Quiz' : 'Start Quiz',
      ariaLabel: 'Quiz experience',
      maxWidth: 920,
      maxHeight: 900,
      contentStyle: paddedScrollContentStyle,
      content:
        quizData && currentUser ? (
          <QuizFlow
            key={`${currentUser}-${quizCompleted ? 'completed' : 'fresh'}`}
            quizData={quizData}
            currentUser={currentUser}
            onComplete={onQuizComplete}
            onEdit={() => {
              setShowQuizFlow(false);
              setShowQuizEditor(true);
            }}
            isCompleted={false}
          />
        ) : (
          <p style={{ margin: 0, color: colors.textSecondary }}>Pick a profile to take the quiz.</p>
        ),
    },
    {
      key: 'matchmaker',
      isOpen: showMatchmaker,
      onClose: () => setShowMatchmaker(false),
      title: 'Matchmaker',
      ariaLabel: 'Movie matchmaker',
      maxWidth: 920,
      maxHeight: 900,
      contentStyle: paddedScrollContentStyle,
      content: <Matchmaker currentUser={currentUser} />,
    },
  ];
}
