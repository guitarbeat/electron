import { useCallback, useState } from 'react';
import type { User } from '../types.ts';
import { getPins, savePin, verifyPin, clearPinCache } from '../services/api/pinService.ts';
import type { UserPins } from '../services/api/pinService.ts';

export const usePins = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyUserPin = useCallback(async (user: User, pin: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const isValid = await verifyPin(user, pin);
      return isValid;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'PIN verification failed';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setUserPin = useCallback(async (user: User, pin: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await savePin(user, pin);
      // Clear cache to ensure fresh data on next fetch
      clearPinCache();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save PIN';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUserPins = useCallback(async (): Promise<UserPins> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const pins = await getPins();
      return pins;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch PINs';
      setError(errorMessage);
      return {};
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearCache = useCallback(() => {
    clearPinCache();
  }, []);

  return {
    isLoading,
    error,
    verifyUserPin,
    setUserPin,
    fetchUserPins,
    clearCache,
  };
};
