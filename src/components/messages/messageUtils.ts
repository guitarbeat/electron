import type { Message, User } from '@/shared/types';

export const IOS_BLUE = '#007aff';
export const IOS_GRAY = '#e5e5ea';
export const IOS_TIMESTAMP = '#8e8e93';

export const isMessageFromCurrentUser = (
  message: Message,
  currentUser: User | null
): boolean => Boolean(currentUser) && message.author === currentUser;
