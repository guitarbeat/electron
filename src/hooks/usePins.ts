import { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { getPins, setPin, removePin, verifyPin, UserPins } from '../services/pinService';

export const usePins = () => {
  const [pins, setPinsState] = useState<UserPins>({});
  const [isLoading, setIsLoading] = useState(true);

  const syncPins = useCallback(async () => {
    const latestPins = await getPins();
    setPinsState(latestPins);
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      await syncPins();
    } catch (error) {
      console.error('Error fetching PINs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [syncPins]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Also refresh every 30 seconds to get latest changes
  useEffect(() => {
    const interval = setInterval(() => {
      refresh();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [refresh]);

  const userHasPin = useCallback((user: User): boolean => !!pins[user], [pins]);

  const setUserPin = useCallback(
    async (user: User, pin: string): Promise<boolean> => {
      try {
        const success = await setPin(user, pin);
        if (success) {
          await syncPins();
        }
        return success;
      } catch (error) {
        console.error('Error setting PIN:', error);
        return false;
      }
    },
    [syncPins]
  );

  const removeUserPin = useCallback(
    async (user: User): Promise<boolean> => {
      try {
        const success = await removePin(user);
        if (success) {
          await syncPins();
        }
        return success;
      } catch (error) {
        console.error('Error removing PIN:', error);
        return false;
      }
    },
    [syncPins]
  );

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
