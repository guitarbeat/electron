import React, { type CSSProperties, type ReactNode } from 'react';

const MessageBoard = React.lazy(() => import('@/components/messages/MessageBoard'));
const FloatingMemoriesPanel = React.lazy(() => import('@/components/memories/FloatingMemoriesPanel'));
const SpinSwipeGame = React.lazy(() => import('@/components/spinMatch/SpinSwipeGame'));
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

const paddedScrollContentStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: spacing.lg,
};

export interface BuildFeatureModalsParams {
  showMessages: boolean;
  showMemoriesPanel: boolean;
  showQuizEditor: boolean;
  showQuizFlow: boolean;
  showSpinWheel: boolean;
  quizCompleted: boolean;
  isSpinWheelLocked: boolean;
  currentUser: User | null;
  setShowMessages: (open: boolean) => void;
  setShowMemoriesPanel: (open: boolean) => void;
  setShowQuizEditor: (open: boolean) => void;
  setShowQuizFlow: (open: boolean) => void;
  setShowSpinWheel: (open: boolean) => void;
  setIsSpinWheelLocked: (locked: boolean) => void;
  onQuizComplete: () => void;
}

export function buildFeatureModals(params: BuildFeatureModalsParams): AppModalConfig[] {
  const {
    showMessages,
    showMemoriesPanel,
    showQuizEditor,
    showQuizFlow,
    showSpinWheel,
    quizCompleted,
    isSpinWheelLocked,
    currentUser,
    setShowMessages,
    setShowMemoriesPanel,
    setShowQuizEditor,
    setShowQuizFlow,
    setShowSpinWheel,
    setIsSpinWheelLocked,
    onQuizComplete,
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
      contentStyle: {
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
      },
      content: (
        <React.Suspense fallback={null}>
          <MessageBoard />
        </React.Suspense>
      ),
    },
    {
      key: 'memories',
      isOpen: showMemoriesPanel,
      onClose: () => setShowMemoriesPanel(false),
      title: 'Notes',
      ariaLabel: 'Shared movie notes',
      maxWidth: 980,
      maxHeight: 920,
      contentStyle: {
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
      },
      content: (
        <React.Suspense fallback={null}>
          <FloatingMemoriesPanel />
        </React.Suspense>
      ),
    },
    {
      key: 'quiz-editor',
      isOpen: showQuizEditor,
      onClose: () => setShowQuizEditor(false),
      title: 'Personality Quiz',
      ariaLabel: 'Personality quiz',
      maxWidth: 1200,
      maxHeight: 900,
      content: (
        <React.Suspense fallback={null}>
          <QuizEditor onClose={() => setShowQuizEditor(false)} />
        </React.Suspense>
      ),
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
      content: (
        <React.Suspense fallback={null}>
          <SpinSwipeGame onSpinningChange={setIsSpinWheelLocked} />
        </React.Suspense>
      ),
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
      content: (
        <React.Suspense fallback={null}>
          <QuizFlowModalContent
            currentUser={currentUser}
            quizCompleted={quizCompleted}
            onComplete={onQuizComplete}
            onEdit={() => {
              setShowQuizFlow(false);
              setShowQuizEditor(true);
            }}
          />
        </React.Suspense>
      ),
    },
  ];
}
