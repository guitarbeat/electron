import { type CSSProperties, type ReactNode } from 'react';
import MessageBoard from '@/components/messages/MessageBoard';
import SpinSwipeGame from '@/components/spinMatch/SpinSwipeGame';
import QuizEditor from '@/components/quiz/QuizEditor';
import QuizFlowModalContent from '@/app/QuizFlowModalContent';
import type { User } from '@/shared/types';
import { spacing } from '@/theme/tokens';

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
  showMessages: boolean;
  showQuizEditor: boolean;
  showQuizFlow: boolean;
  showSpinWheel: boolean;
  quizCompleted: boolean;
  isSpinWheelLocked: boolean;
  currentUser: User | null;
  setShowMessages: (open: boolean) => void;
  setShowQuizEditor: (open: boolean) => void;
  setShowQuizFlow: (open: boolean) => void;
  setShowSpinWheel: (open: boolean) => void;
  setIsSpinWheelLocked: (locked: boolean) => void;
  onQuizComplete: () => void;
}

export function buildFeatureModals(params: BuildFeatureModalsParams): AppModalConfig[] {
  const {
    showMessages,
    showQuizEditor,
    showQuizFlow,
    showSpinWheel,
    quizCompleted,
    isSpinWheelLocked,
    currentUser,
    setShowMessages,
    setShowQuizEditor,
    setShowQuizFlow,
    setShowSpinWheel,
    setIsSpinWheelLocked,
    onQuizComplete,
  } = params;

  return [
    {
      key: 'messages',
      isOpen: showMessages,
      onClose: () => setShowMessages(false),
      title: 'Messages',
      ariaLabel: 'Shared messages',
      maxWidth: 820,
      maxHeight: 920,
      contentStyle: {
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
      },
      content: <MessageBoard />,
    },
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
      key: 'spin-match',
      isOpen: showSpinWheel,
      onClose: () => setShowSpinWheel(false),
      title: 'Spin & Match',
      ariaLabel: 'Swipe to pick movies, then spin the wheel',
      maxWidth: 520,
      maxHeight: 820,
      closeDisabled: isSpinWheelLocked,
      closeDisabledLabel: 'Finish the current spin before closing.',
      content: <SpinSwipeGame onSpinningChange={setIsSpinWheelLocked} />,
      contentStyle: { flex: 1, overflowY: 'auto' },
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
      content: currentUser ? (
        <QuizFlowModalContent
          currentUser={currentUser}
          quizCompleted={quizCompleted}
          onComplete={onQuizComplete}
          onEdit={() => {
            setShowQuizFlow(false);
            setShowQuizEditor(true);
          }}
        />
      ) : null,
    },
  ];
}
