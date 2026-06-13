import type { MainTab } from '@/shared/types';

export interface WorkspaceMeta {
  eyebrow: string;
  title: string;
  icon: string;
}

const WORKSPACE_META: Record<MainTab, WorkspaceMeta> = {
  movies: {
    eyebrow: 'Movies',
    title: 'Movies',
    icon: '🎬',
  },
  places: {
    eyebrow: 'Dates',
    title: 'Date Ideas',
    icon: '📍',
  },
};

export const getWorkspaceMeta = (activeTab: MainTab): WorkspaceMeta => WORKSPACE_META[activeTab];
