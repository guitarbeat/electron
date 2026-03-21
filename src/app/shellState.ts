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
      description: `No seat is active yet. Tune the shared quiz before the next run. ${promptCountLabel} ready.`,
    };
  }

  if (quizCompleted) {
    return {
      label: 'Retake Quiz',
      description: `${currentUser} can rerun the compatibility ritual whenever the mood changes. ${promptCountLabel} loaded.`,
    };
  }

  return {
    label: 'Start Quiz',
    description: `${currentUser} is active. Start the shared ritual and see where tonight lands. ${promptCountLabel} loaded.`,
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
    eyebrow: 'Movie Night Queue',
    title: 'Watchlist',
    description: 'Capture picks fast, review suggestions, and keep shared memories attached to the movies that matter.',
    icon: '🎬',
  },
  places: {
    eyebrow: 'Date Spots Atlas',
    title: 'Date Spots',
    description: 'Keep the outing list focused on ideas, visited spots, and map-aware planning without extra shell clutter.',
    icon: '📍',
  },
};

export const getWorkspaceMeta = (activeTab: MainTab): WorkspaceMeta => WORKSPACE_META[activeTab];
