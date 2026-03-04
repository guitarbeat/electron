import { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import {
  getPins,
  setPin,
  removePin,
  verifyPin,
  hasPin,
  UserPins,
  clearPinCache,
} from '../services/pinService';

export const usePins = () => {
  const [pins, setPinsState] = useState<UserPins>({});
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    console.log('🔄 Refreshing PINs...');
    clearPinCache(); // Clear cache to force fresh fetch
    try {
      const fetchedPins = await getPins();
      console.log('📥 Fetched PINs:', fetchedPins);
      setPinsState(fetchedPins);
      console.log('✅ PIN state updated:', fetchedPins);
    } catch (error) {
      console.error('❌ Error fetching PINs:', error);
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

  const userHasPin = useCallback(
    (user: User): boolean => {
      const hasPin = !!pins[user];
      console.log(`🔍 Checking PIN for ${user}:`, hasPin, 'Current pins:', pins);
      return hasPin;
    },
    [pins]
  );

  const setUserPin = useCallback(
    async (user: User, pin: string): Promise<boolean> => {
      const success = await setPin(user, pin);
      if (success) {
        await refresh();
      }
      return success;
    },
    [refresh]
  );

  const removeUserPin = useCallback(
    async (user: User): Promise<boolean> => {
      const success = await removePin(user);
      if (success) {
        await refresh();
      }
      return success;
    },
    [refresh]
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
