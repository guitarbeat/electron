import type { MainTab } from '@/shared/types';

export type ShellActionId = 'spin-match';

export interface ShellActionMeta {
  id: ShellActionId;
  label: string;
  description: string;
}

interface ShellActionMetaParams {
  activeTab: MainTab;
}

export const getShellActionMeta = ({
  activeTab,
}: ShellActionMetaParams): ShellActionMeta[] => {
  if (activeTab !== 'queue') {
    return [];
  }

  return [
    {
      id: 'spin-match',
      label: 'Spin & Match',
      description: 'Keep a subset, then spin that pool.',
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
