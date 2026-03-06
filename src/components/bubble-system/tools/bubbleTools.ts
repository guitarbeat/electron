import type { BubbleToolId } from '../types/bubbleLayout';

export interface BubbleToolConfig {
  id: BubbleToolId;
  label: string;
  emoji: string;
  component: React.ComponentType<any>;
  defaultPosition?: { x: number; y: number };
  requiresAuth?: boolean;
  props?: Record<string, any>;
}

export const BUBBLE_TOOLS: BubbleToolConfig[] = [
  {
    id: 'messages',
    label: 'Messages',
    emoji: '💬',
    component: () => null, // Will be dynamically imported
  },
  {
    id: 'spin',
    label: 'Spin',
    emoji: '🎰',
    component: () => null, // Will be dynamically imported
  },
  {
    id: 'snake',
    label: 'Snake',
    emoji: '🐍',
    component: () => null, // Will be dynamically imported
  },
  {
    id: 'foodDrop',
    label: 'Food Drop',
    emoji: '🍉',
    component: () => null, // Will be dynamically imported
  },
  {
    id: 'quiz',
    label: 'Quiz',
    emoji: '❓',
    component: () => null, // Will be dynamically imported
    defaultPosition: {
      x: 60,
      y: 200, // Will be calculated dynamically
    },
  },
  {
    id: 'matchmaker',
    label: 'Matchmaker',
    emoji: '💕',
    component: () => null, // Will be dynamically imported
    defaultPosition: {
      x: 60,
      y: 280, // Will be calculated dynamically
    },
    requiresAuth: true,
  },
];

export const getToolConfig = (id: BubbleToolId): BubbleToolConfig | undefined => {
  return BUBBLE_TOOLS.find(tool => tool.id === id);
};

export const getVisibleTools = (hiddenIds: Set<BubbleToolId>): BubbleToolConfig[] => {
  return BUBBLE_TOOLS.filter(tool => !hiddenIds.has(tool.id));
};
