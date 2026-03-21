import type { QuizData } from '@/hooks/useQuiz';
import type { MainTab, User } from '@/types';

export interface QuizLaunchState {
  label: string;
  description: string;
}

interface QuizLaunchStateParams {
  currentUser: User | null;
  quizCompleted: boolean;
  quizData?: QuizData | null;
}

const formatPromptCount = (quizData?: QuizData | null): string => {
  const promptCount = quizData?.questions.length ?? 0;
  return `${promptCount} prompt${promptCount === 1 ? '' : 's'}`;
};

export const getQuizLaunchState = ({
  currentUser,
  quizCompleted,
  quizData,
}: QuizLaunchStateParams): QuizLaunchState => {
  const promptCountLabel = formatPromptCount(quizData);

  if (!currentUser) {
    return {
      label: 'Edit Quiz',
      description: `No profile is selected. Update the quiz whenever you want. ${promptCountLabel} ready.`,
    };
  }

  if (quizCompleted) {
    return {
      label: 'Retake Quiz',
      description: `${currentUser} can take the quiz again any time. ${promptCountLabel} loaded.`,
    };
  }

  return {
    label: 'Start Quiz',
    description: `${currentUser} is signed in. Start the quiz whenever you're ready. ${promptCountLabel} loaded.`,
  };
};

export interface WorkspaceMeta {
  eyebrow: string;
  title: string;
  description: string;
  icon: string;
}

const WORKSPACE_META: Record<MainTab, WorkspaceMeta> = {
  queue: {
    eyebrow: 'Movies',
    title: 'Watchlist',
    description: 'Keep track of what you want to watch together and leave notes on the ones you finish.',
    icon: '🎬',
  },
  places: {
    eyebrow: 'Dates',
    title: 'Date Ideas',
    description: 'Save places to try, mark the ones you have been to, and keep the map nearby when you need it.',
    icon: '📍',
  },
};

export const getWorkspaceMeta = (activeTab: MainTab): WorkspaceMeta => WORKSPACE_META[activeTab];
