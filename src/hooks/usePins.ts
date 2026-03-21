import { useCallback, useEffect } from 'react';
import { useAppSession, useUser } from '@/context';
import { mutateScope } from '@/services/stateClient';
import type { User } from '../types.ts';

const PINS_POLL_INTERVAL = 30000;

export const usePins = (isPaused: boolean = false) => {
  const { currentUser } = useUser();
  const {
    hasAccess,
    pinProtectedUsers,
    isSessionLoading,
    refreshSession,
  } = useAppSession();

  useEffect(() => {
    if (isPaused || !hasAccess) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void refreshSession();
    }, PINS_POLL_INTERVAL);

    return () => window.clearInterval(intervalId);
  }, [hasAccess, isPaused, refreshSession]);

  const userHasPin = useCallback(
    (user: User): boolean => pinProtectedUsers.includes(user),
    [pinProtectedUsers]
  );

  const setUserPin = useCallback(
    async (user: User, pin: string): Promise<boolean> => {
      if (!hasAccess || !currentUser || currentUser !== user) {
        return false;
      }

      try {
        await mutateScope('pins', {
          op: 'set_pin',
          payload: { pin },
          optimisticData: {
            Aaron: user === 'Aaron' || pinProtectedUsers.includes('Aaron'),
            Electra: user === 'Electra' || pinProtectedUsers.includes('Electra'),
          },
        });
        await refreshSession();
        return true;
      } catch (error) {
        console.error('Error setting PIN:', error);
        return false;
      }
    },
    [currentUser, hasAccess, pinProtectedUsers, refreshSession]
  );

  const removeUserPin = useCallback(
    async (user: User): Promise<boolean> => {
      if (!hasAccess || !currentUser || currentUser !== user) {
        return false;
      }

      try {
        await mutateScope('pins', {
          op: 'remove_pin',
          payload: {},
          optimisticData: {
            Aaron: user === 'Aaron' ? false : pinProtectedUsers.includes('Aaron'),
            Electra: user === 'Electra' ? false : pinProtectedUsers.includes('Electra'),
          },
        });
        await refreshSession();
        return true;
      } catch (error) {
        console.error('Error removing PIN:', error);
        return false;
      }
    },
    [currentUser, hasAccess, pinProtectedUsers, refreshSession]
  );

  const verifyUserPin = useCallback(
    async (user: User, pin: string): Promise<boolean> => {
      if (!hasAccess) {
        return false;
      }

      try {
        const response = await fetch('/api/session/profile', {
          method: 'POST',
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user, pin }),
        });

        if (response.status === 401 || response.status === 403) {
          return false;
        }

        if (!response.ok) {
          throw new Error('Failed to verify PIN.');
        }

        await refreshSession();
        return true;
      } catch (error) {
        console.error('PIN verification failed:', error);
        return false;
      }
    },
    [hasAccess, refreshSession]
  );

  return {
    pins: {
      Aaron: pinProtectedUsers.includes('Aaron'),
      Electra: pinProtectedUsers.includes('Electra'),
    },
    isLoading: isSessionLoading,
    userHasPin,
    setUserPin,
    removeUserPin,
    verifyUserPin,
    refresh: refreshSession,
  };
};
