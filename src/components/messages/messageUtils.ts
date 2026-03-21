import type { Message, User } from '@/types';

export const IOS_BLUE = '#007aff';
export const IOS_GRAY = '#e5e5ea';
export const IOS_TIMESTAMP = '#8e8e93';

export const formatMessageTimestamp = (date: string): string => {
  try {
    const timestamp = new Date(date);
    const now = new Date();

    if (Number.isNaN(timestamp.getTime()) || Number.isNaN(now.getTime())) {
      return '';
    }

    const diffSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);

    if (diffSeconds < 0) {
      return '';
    }

    if (diffSeconds < 86400) {
      const hours = timestamp.getHours();
      const minutes = timestamp.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    }

    return timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
};

export const isMessageFromCurrentUser = (
  message: Message,
  currentUser: User | null
): boolean => Boolean(currentUser) && message.author === currentUser;
