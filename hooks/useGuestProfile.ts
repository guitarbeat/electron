import { useCallback, useEffect, useState } from 'react';
import {
  clearGuestName as clearGuestNameService,
  getGuestName,
  saveGuestName,
  subscribeGuestName,
  MAX_GUEST_NAME_LENGTH,
  normalizeGuestName,
  isReservedProfileName,
} from '../services/guestProfileService';

export const useGuestProfile = () => {
  const [guestName, setGuestNameState] = useState<string>(() => getGuestName());

  useEffect(() => {
    return subscribeGuestName(setGuestNameState);
  }, []);

  const setGuestName = useCallback((value: string): string => {
    const normalized = saveGuestName(value);
    setGuestNameState(normalized);
    return normalized;
  }, []);

  const clearGuestName = useCallback(() => {
    clearGuestNameService();
    setGuestNameState('');
  }, []);

  return {
    guestName,
    hasGuestName: Boolean(guestName),
    setGuestName,
    clearGuestName,
    refreshGuestName: () => setGuestNameState(getGuestName()),
  };
};

export { MAX_GUEST_NAME_LENGTH, normalizeGuestName, isReservedProfileName };
