import React, { createContext, useState, useContext, ReactNode, useMemo } from 'react';
import { User } from '../types';

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    // Persist user selection across sessions
    return sessionStorage.getItem('currentUser') as User | null;
  });

  const value = useMemo(
    () => ({
      currentUser,
      setCurrentUser: (user: User | null) => {
        if (user) {
          sessionStorage.setItem('currentUser', user);
        } else {
          sessionStorage.removeItem('currentUser');
        }
        setCurrentUser(user);
      },
    }),
    [currentUser]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
