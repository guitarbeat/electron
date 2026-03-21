import type { MainTab, User } from '@/types';

export interface QuizLaunchState {
  label: string;
}

interface QuizLaunchStateParams {
  currentUser: User | null;
  quizCompleted: boolean;
}

export const getQuizLaunchState = ({
  currentUser,
  quizCompleted,
}: QuizLaunchStateParams): QuizLaunchState => {
  if (!currentUser) {
    return {
      label: 'Editor',
    };
  }

  if (quizCompleted) {
    return {
      label: 'Retake',
    };
  }

  return {
    label: 'Quiz',
  };
};

export interface WorkspaceMeta {
  eyebrow: string;
  title: string;
  icon: string;
}

const WORKSPACE_META: Record<MainTab, WorkspaceMeta> = {
  queue: {
    eyebrow: 'Movies',
    title: 'Watchlist',
    icon: '🎬',
  },
  places: {
    eyebrow: 'Dates',
    title: 'Date Ideas',
    icon: '📍',
  },
};

export const getWorkspaceMeta = (activeTab: MainTab): WorkspaceMeta => WORKSPACE_META[activeTab];
