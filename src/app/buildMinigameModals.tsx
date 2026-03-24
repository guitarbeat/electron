import { useState, type CSSProperties, type ReactNode } from 'react';
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

type PickTab = 'spin' | 'match';

const tabBarStyle: CSSProperties = {
  display: 'flex',
  borderBottom: '1px solid rgba(255,255,255,0.1)',
  flexShrink: 0,
};

function tabButtonStyle(active: boolean): CSSProperties {
  return {
    flex: 1,
    padding: '0.65rem 1rem',
    background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
    border: 'none',
    borderBottom: active ? '2px solid var(--color-accent)' : '2px solid transparent',
    color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
    fontFamily: 'var(--type-button-label-family)',
    fontSize: '0.78rem',
    fontWeight: active ? 700 : 500,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    transition: 'all 0.18s ease',
  };
}

function SpinMatchModal({
  currentUser,
  onSpinningChange,
}: {
  currentUser: User | null;
  onSpinningChange: (locked: boolean) => void;
}) {
  const [tab, setTab] = useState<PickTab>('spin');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={tabBarStyle}>
        <button type="button" style={tabButtonStyle(tab === 'spin')} onClick={() => setTab('spin')}>
          🎰 Spin Wheel
        </button>
        <button type="button" style={tabButtonStyle(tab === 'match')} onClick={() => setTab('match')}>
          💘 Matchmaker
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: spacing.lg }}>
        {tab === 'spin' ? (
          <SpinWheelGame onSpinningChange={onSpinningChange} />
        ) : (
          <Matchmaker currentUser={currentUser} />
        )}
      </div>
    </div>
  );
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
      ariaLabel: 'Spin wheel and matchmaker',
      maxWidth: 920,
      maxHeight: 900,
      closeDisabled: isSpinWheelLocked,
      closeDisabledLabel: 'Finish the current spin before closing.',
      content: (
        <SpinMatchModal
          currentUser={currentUser}
          onSpinningChange={setIsSpinWheelLocked}
        />
      ),
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
  ];
}
