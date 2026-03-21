import type { CSSProperties, ReactNode } from 'react';
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

export interface BuildQuizModalsParams {
  showQuizEditor: boolean;
  showQuizFlow: boolean;
  quizCompleted: boolean;
  quizData: QuizData | null | undefined;
  currentUser: User | null;
  setShowQuizEditor: (open: boolean) => void;
  setShowQuizFlow: (open: boolean) => void;
  onQuizComplete: () => void;
}

export function buildQuizModals(params: BuildQuizModalsParams): AppModalConfig[] {
  const {
    showQuizEditor,
    showQuizFlow,
    quizCompleted,
    quizData,
    currentUser,
    setShowQuizEditor,
    setShowQuizFlow,
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
  ];
}
