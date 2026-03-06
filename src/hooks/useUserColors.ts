import { colors } from '@/design-system/tokens.ts';
import type { User } from '@/types.ts';

export interface UserStyle {
  primary: string;
  light: string;
  gradient: string;
  glowColor: string;
  borderColor: string;
  accentColor: string;
}

export interface MessageBubbleStyle {
  gradient: string;
  tailLeft: string;
  tailRight: string;
}

const USER_COLOR_MAP: Record<User, UserStyle> = {
  Aaron: {
    primary: colors.secondary, // Light Sky Blue
    light: colors.secondaryHover,
    gradient: colors.gradientBlue,
    glowColor: 'rgba(149, 220, 255, 0.55)',
    borderColor: colors.borderSecondary,
    accentColor: colors.secondary,
  },
  Electra: {
    primary: colors.accent, // Hot Pink
    light: colors.accentHover,
    gradient: colors.gradientPink,
    glowColor: 'rgba(255, 127, 198, 0.55)',
    borderColor: colors.border,
    accentColor: colors.accent,
  },
};

const MESSAGE_BUBBLE_STYLES: MessageBubbleStyle[] = [
  {
    gradient: colors.gradientBlue,
    tailLeft: colors.secondary,
    tailRight: colors.secondaryHover,
  },
  {
    gradient: colors.gradientPink,
    tailLeft: colors.accent,
    tailRight: colors.accentHover,
  },
  {
    gradient: colors.gradientPurple,
    tailLeft: colors.tertiary,
    tailRight: colors.tertiaryHover,
  },
];

/**
 * Hook to get consistent color scheme for a user
 * Ensures Aaron always uses blue and Electra always uses pink throughout the app
 */
export const useUserColors = (user: User | null | undefined): UserStyle | null => {
  if (!user) return null;
  return USER_COLOR_MAP[user] || null;
};

/**
 * Get color for a user without hook (for use in non-component code)
 */
export const getUserColor = (user: User | null | undefined): UserStyle | null => {
  if (!user) return null;
  return USER_COLOR_MAP[user] || null;
};

/**
 * Get badge background color for watcher indicator
 */
export const getWatcherBadgeColor = (user: User): string => {
  return USER_COLOR_MAP[user].primary;
};

/**
 * Get all user colors (for palette or legend)
 */
export const getAllUserColors = (): Record<User, UserStyle> => {
  return USER_COLOR_MAP;
};

/**
 * Get message bubble style for a user (for chat messages)
 */
export const getMessageBubbleStyle = (username: string): MessageBubbleStyle => {
  // Explicit overrides for main users
  if (username.toLowerCase() === 'aaron') return MESSAGE_BUBBLE_STYLES[0]; // Blue
  if (username.toLowerCase() === 'electra') return MESSAGE_BUBBLE_STYLES[1]; // Pink

  // Deterministic selection for others based on username hash
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % MESSAGE_BUBBLE_STYLES.length;
  return MESSAGE_BUBBLE_STYLES[index];
};
