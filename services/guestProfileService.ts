export const GUEST_NAME_STORAGE_KEY = 'movieWatchlistGuestName';
export const GUEST_PROFILE_UPDATED_EVENT = 'movie-watchlist:guest-profile-updated';
export const MAX_GUEST_NAME_LENGTH = 40;

export const normalizeGuestName = (value: string): string => {
  return value.trim().slice(0, MAX_GUEST_NAME_LENGTH);
};

export const isReservedProfileName = (value: string): boolean => {
  const normalized = value.trim().toLowerCase();
  return normalized === 'aaron' || normalized === 'electra';
};

export const getGuestName = (): string => {
  if (typeof window === 'undefined') {
    return '';
  }

  return localStorage.getItem(GUEST_NAME_STORAGE_KEY)?.trim() || '';
};

const notifyGuestProfileUpdate = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent(GUEST_PROFILE_UPDATED_EVENT));
};

export const saveGuestName = (value: string): string => {
  const normalized = normalizeGuestName(value);

  if (typeof window === 'undefined') {
    return normalized;
  }

  if (normalized) {
    localStorage.setItem(GUEST_NAME_STORAGE_KEY, normalized);
  } else {
    localStorage.removeItem(GUEST_NAME_STORAGE_KEY);
  }

  notifyGuestProfileUpdate();
  return normalized;
};

export const clearGuestName = () => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(GUEST_NAME_STORAGE_KEY);
  notifyGuestProfileUpdate();
};

export const subscribeGuestName = (listener: (name: string) => void): (() => void) => {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handleUpdate = () => {
    listener(getGuestName());
  };

  window.addEventListener(GUEST_PROFILE_UPDATED_EVENT, handleUpdate as EventListener);
  window.addEventListener('storage', handleUpdate);

  return () => {
    window.removeEventListener(GUEST_PROFILE_UPDATED_EVENT, handleUpdate as EventListener);
    window.removeEventListener('storage', handleUpdate);
  };
};
