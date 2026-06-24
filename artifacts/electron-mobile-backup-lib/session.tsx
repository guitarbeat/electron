import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import type { User } from "./types";

const SESSION_KEY = "electron.selectedUser";

interface SessionContextValue {
  selectedUser: User | null;
  setSelectedUser: (user: User | null) => void;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextValue>({
  selectedUser: null,
  setSelectedUser: () => {},
  isLoading: true,
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [selectedUser, setSelectedUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY)
      .then((val) => {
        if (val === "Aaron" || val === "Electra") {
          setSelectedUserState(val);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const setSelectedUser = (user: User | null) => {
    setSelectedUserState(user);
    if (user) {
      AsyncStorage.setItem(SESSION_KEY, user);
    } else {
      AsyncStorage.removeItem(SESSION_KEY);
    }
  };

  return (
    <SessionContext.Provider value={{ selectedUser, setSelectedUser, isLoading }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
