import { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { getPins, setPin, removePin, verifyPin, hasPin, UserPins } from '../services/pinService';

export const usePins = () => {
  const [pins, setPinsState] = useState<UserPins>({});
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedPins = await getPins();
      setPinsState(fetchedPins);
    } catch (error) {
      console.error('Error fetching PINs:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const userHasPin = useCallback((user: User): boolean => {
    return !!pins[user];
  }, [pins]);

  const setUserPin = useCallback(async (user: User, pin: string): Promise<boolean> => {
    const success = await setPin(user, pin);
    if (success) {
      await refresh();
    }
    return success;
  }, [refresh]);

  const removeUserPin = useCallback(async (user: User): Promise<boolean> => {
    const success = await removePin(user);
    if (success) {
      await refresh();
    }
    return success;
  }, [refresh]);

  const verifyUserPin = useCallback(async (user: User, pin: string): Promise<boolean> => {
    return verifyPin(user, pin);
  }, []);

  return {
    pins,
    isLoading,
    userHasPin,
    setUserPin,
    removeUserPin,
    verifyUserPin,
    refresh,
  };
};
