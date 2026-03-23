import type { CSSProperties, ReactNode } from 'react';
import MessageBoard from '@/components/messages/MessageBoard';
import SpinWheelGame from '@/components/spinWheel/SpinWheelGame';
import Matchmaker from '@/components/matchmaker/Matchmaker';
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
  showMatchmaker: boolean;
  quizCompleted: boolean;
  isSpinWheelLocked: boolean;
  currentUser: User | null;
  setShowMessages: (open: boolean) => void;
  setShowQuizEditor: (open: boolean) => void;
  setShowQuizFlow: (open: boolean) => void;
  setShowSpinWheel: (open: boolean) => void;
  setShowMatchmaker: (open: boolean) => void;
  setIsSpinWheelLocked: (locked: boolean) => void;
  onQuizComplete: () => void;
}

export function buildFeatureModals(params: BuildFeatureModalsParams): AppModalConfig[] {
  const {
    showMessages,
    showQuizEditor,
    showQuizFlow,
    showSpinWheel,
    showMatchmaker,
    quizCompleted,
    isSpinWheelLocked,
    currentUser,
    setShowMessages,
    setShowQuizEditor,
    setShowQuizFlow,
    setShowSpinWheel,
    setShowMatchmaker,
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
        currentUser ? (
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
