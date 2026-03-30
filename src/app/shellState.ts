import type { MainTab, User } from '@/shared/types';

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
      label: 'Edit Quiz',
    };
  }

  if (quizCompleted) {
    return {
      label: 'Retake Quiz',
    };
  }

  return {
    label: 'Start Quiz',
  };
};

export type ShellActionId = 'messages' | 'notes' | 'quiz' | 'spin-match';

export interface ShellActionMeta {
  id: ShellActionId;
  label: string;
  description: string;
}

interface ShellActionMetaParams extends QuizLaunchStateParams {
  activeTab: MainTab;
}

export const getShellActionMeta = ({
  activeTab,
  currentUser,
  quizCompleted,
}: ShellActionMetaParams): ShellActionMeta[] => {
  const quizLaunch = getQuizLaunchState({ currentUser, quizCompleted });
  const actions: ShellActionMeta[] = [
    {
      id: 'messages',
      label: 'Messages',
      description: 'Open the shared chat.',
    },
    {
      id: 'quiz',
      label: quizLaunch.label,
      description: currentUser
        ? 'Find your movie personality together.'
        : 'Edit the quiz before a profile joins.',
    },
  ];

  if (activeTab !== 'queue') {
    return actions;
  }

  return [
    actions[0],
    {
      id: 'notes',
      label: 'Notes',
      description: 'Browse and add shared movie notes.',
    },
    actions[1],
    {
      id: 'spin-match',
      label: 'Spin & Match',
      description: 'Swipe together, then spin for a pick.',
    },
  ];
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
