import { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { pinService, type UserPins } from '../services/features/pinService.ts';

export const usePins = () => {
  const [pins, setPinsState] = useState<UserPins>({});
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedPins = await pinService.getPins();
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
        const success = await pinService.setPin(user, pin);
        if (success) {
          const latestPins = await pinService.getPins();
          setPinsState(latestPins);
        }
        return success;
      } catch (error) {
        console.error('Error setting PIN:', error);
        return false;
      }
    },
    [refresh]
  );

  const removeUserPin = useCallback(
    async (user: User): Promise<boolean> => {
      try {
        const success = await pinService.removePin(user);
        if (success) {
          const latestPins = await pinService.getPins();
          setPinsState(latestPins);
        }
        return success;
      } catch (error) {
        console.error('Error removing PIN:', error);
        return false;
      }
    },
    [refresh]
  );

  const verifyUserPin = useCallback(async (user: User, pin: string): Promise<boolean> => {
    return pinService.verifyPin(user, pin);
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
