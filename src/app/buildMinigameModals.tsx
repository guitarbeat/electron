import React, { type CSSProperties, type ReactNode } from 'react';

const MessageBoard = React.lazy(() => import('@/components/messages/MessageBoard'));
const FloatingMemoriesPanel = React.lazy(() => import('@/components/memories/FloatingMemoriesPanel'));
const SpinSwipeGame = React.lazy(() => import('@/components/spinMatch/SpinSwipeGame'));
const SpinWheelGame = React.lazy(() => import('@/components/spinWheel/SpinWheelGame'));
const QuizEditor = React.lazy(() => import('@/components/quiz/QuizEditor'));
const QuizFlowModalContent = React.lazy(() => import('@/app/QuizFlowModalContent'));
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

const scrollContentStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
};

const paddedScrollContentStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: spacing.lg,
};

const renderSuspended = (content: ReactNode) => (
  <React.Suspense fallback={null}>{content}</React.Suspense>
);

export interface BuildFeatureModalsParams {
  showMessages: boolean;
  showMemoriesPanel: boolean;
  showQuizEditor: boolean;
  showQuizFlow: boolean;
  showSpinWheel: boolean;
  showSpinWheelOnly: boolean;
  quizCompleted: boolean;
  isSpinWheelLocked: boolean;
  currentUser: User | null;
  setShowMessages: (open: boolean) => void;
  setShowMemoriesPanel: (open: boolean) => void;
  setShowQuizEditor: (open: boolean) => void;
  setShowQuizFlow: (open: boolean) => void;
  setShowSpinWheel: (open: boolean) => void;
  setShowSpinWheelOnly: (open: boolean) => void;
  setIsSpinWheelLocked: (locked: boolean) => void;
  onQuizComplete: () => void;
  onQuizRetake: () => void;
}

export function buildFeatureModals(params: BuildFeatureModalsParams): AppModalConfig[] {
  const {
    showMessages,
    showMemoriesPanel,
    showQuizEditor,
    showQuizFlow,
    showSpinWheel,
    showSpinWheelOnly,
    quizCompleted,
    isSpinWheelLocked,
    currentUser,
    setShowMessages,
    setShowMemoriesPanel,
    setShowQuizEditor,
    setShowQuizFlow,
    setShowSpinWheel,
    setShowSpinWheelOnly,
    setIsSpinWheelLocked,
    onQuizComplete,
    onQuizRetake,
  } = params;

  return [
    {
      key: 'messages',
      title: 'Messages',
      isOpen: showMessages,
      onClose: () => setShowMessages(false),
      ariaLabel: 'Shared messages',
      maxWidth: 820,
      maxHeight: 920,
      contentStyle: scrollContentStyle,
      content: renderSuspended(<MessageBoard />),
    },
    {
      key: 'memories',
      isOpen: showMemoriesPanel,
      onClose: () => setShowMemoriesPanel(false),
      title: 'Notes',
      ariaLabel: 'Shared movie notes',
      maxWidth: 980,
      maxHeight: 920,
      contentStyle: scrollContentStyle,
      content: renderSuspended(<FloatingMemoriesPanel />),
    },
    {
      key: 'quiz-editor',
      isOpen: showQuizEditor,
      onClose: () => setShowQuizEditor(false),
      title: 'Personality Quiz',
      ariaLabel: 'Personality quiz',
      maxWidth: 1200,
      maxHeight: 900,
      content: renderSuspended(<QuizEditor onClose={() => setShowQuizEditor(false)} />),
    },
    {
      key: 'spin-match',
      isOpen: showSpinWheel,
      onClose: () => setShowSpinWheel(false),
      title: 'Spin & Match',
      ariaLabel: 'Choose a subset of movies, then spin the wheel',
      maxWidth: 520,
      maxHeight: 820,
      closeDisabled: isSpinWheelLocked,
      closeDisabledLabel: 'Finish the current spin before closing.',
      content: renderSuspended(<SpinSwipeGame onSpinningChange={setIsSpinWheelLocked} />),
      contentStyle: { flex: 1, overflowY: 'auto' },
    },
    {
      key: 'spin-wheel-only',
      isOpen: showSpinWheelOnly,
      onClose: () => setShowSpinWheelOnly(false),
      title: 'Spin the Wheel',
      ariaLabel: 'Spin the wheel to pick a movie',
      maxWidth: 520,
      maxHeight: 700,
      content: renderSuspended(<SpinWheelGame />),
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
      content: renderSuspended(
        <QuizFlowModalContent
          currentUser={currentUser}
          quizCompleted={quizCompleted}
          onComplete={onQuizComplete}
          onRetake={onQuizRetake}
          onEdit={() => {
            setShowQuizFlow(false);
            setShowQuizEditor(true);
          }}
        />
      ),
    },
  ];
}
