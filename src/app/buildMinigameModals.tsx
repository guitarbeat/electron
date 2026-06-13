import { type CSSProperties, type ReactNode } from 'react';
import LazyBoundary from '@/app/LazyBoundary';
import {
  MessageBoardPanel,
  QuizEditorPanel,
  QuizFlowModalPanel,
  SpinSwipeGamePanel,
  SpinWheelGamePanel,
} from '@/app/lazyFeaturePanels';
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

const renderSuspended = (content: ReactNode, label: string) => (
  <LazyBoundary label={label}>{content}</LazyBoundary>
);

export interface BuildFeatureModalsParams {
  showMessages: boolean;
  showQuizEditor: boolean;
  showQuizFlow: boolean;
  showSpinWheel: boolean;
  showSpinWheelOnly: boolean;
  quizCompleted: boolean;
  isSpinWheelLocked: boolean;
  currentUser: User | null;
  setShowMessages: (open: boolean) => void;
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
    showQuizEditor,
    showQuizFlow,
    showSpinWheel,
    showSpinWheelOnly,
    quizCompleted,
    isSpinWheelLocked,
    currentUser,
    setShowMessages,
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
      title: 'Messages · Conversation',
      isOpen: showMessages,
      onClose: () => setShowMessages(false),
      ariaLabel: 'Shared messages',
      maxWidth: 820,
      maxHeight: 920,
      contentStyle: scrollContentStyle,
      content: renderSuspended(<MessageBoardPanel />, 'Loading messages'),
    },
    {
      key: 'quiz-editor',
      isOpen: showQuizEditor,
      onClose: () => setShowQuizEditor(false),
      title: 'Quiz · Personality',
      ariaLabel: 'Personality quiz',
      maxWidth: 1200,
      maxHeight: 900,
      content: renderSuspended(
        <QuizEditorPanel onClose={() => setShowQuizEditor(false)} />,
        'Loading quiz editor'
      ),
    },
    {
      key: 'spin-match',
      isOpen: showSpinWheel,
      onClose: () => setShowSpinWheel(false),
      title: 'Spin · Match Game',
      ariaLabel: 'Choose a subset of movies, then spin the wheel',
      maxWidth: 520,
      maxHeight: 820,
      closeDisabled: isSpinWheelLocked,
      closeDisabledLabel: 'Finish the current spin before closing.',
      content: renderSuspended(
        <SpinSwipeGamePanel onSpinningChange={setIsSpinWheelLocked} />,
        'Loading spin match'
      ),
      contentStyle: { flex: 1, overflowY: 'auto' },
    },
    {
      key: 'spin-wheel-only',
      isOpen: showSpinWheelOnly,
      onClose: () => setShowSpinWheelOnly(false),
      title: 'Spin · Wheel Picker',
      ariaLabel: 'Spin the wheel to pick a movie',
      maxWidth: 520,
      maxHeight: 700,
      content: renderSuspended(<SpinWheelGamePanel />, 'Loading spin wheel'),
      contentStyle: { flex: 1, overflowY: 'auto' },
    },
    {
      key: 'quiz-flow',
      isOpen: showQuizFlow,
      onClose: () => setShowQuizFlow(false),
      title: quizCompleted ? 'Quiz · Retake Flow' : 'Quiz · Start Flow',
      ariaLabel: 'Quiz experience',
      maxWidth: 920,
      maxHeight: 900,
      contentStyle: paddedScrollContentStyle,
      content: renderSuspended(
        <QuizFlowModalPanel
          currentUser={currentUser}
          quizCompleted={quizCompleted}
          onComplete={onQuizComplete}
          onRetake={onQuizRetake}
          onEdit={() => {
            setShowQuizFlow(false);
            setShowQuizEditor(true);
          }}
        />,
        'Loading quiz'
      ),
    },
  ];
}
