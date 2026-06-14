import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { getSession, signIn as apiSignIn, signOut as apiSignOut } from "@/lib/api";
import type { User } from "@/lib/api";

interface SessionContextValue {
  currentUser: User | null;
  hasAccess: boolean;
  loading: boolean;
  error: string | null;
  signIn: (user: User) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const session = await getSession();
      setCurrentUser(session.currentUser);
      setHasAccess(session.hasAccess);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load session");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const signIn = useCallback(
    async (user: User) => {
      setLoading(true);
      try {
        const session = await apiSignIn(user);
        setCurrentUser(session.currentUser);
        setHasAccess(session.hasAccess);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await apiSignOut();
      setCurrentUser(null);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <SessionContext.Provider
      value={{ currentUser, hasAccess, loading, error, signIn, signOut, refresh }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}
