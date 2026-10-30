import { useState, useEffect } from "react";
import type { User } from "@/shared/types";

export function usePersistentAuth() {
  const [currentUser, setCurrentUser] = useState<User>("Aaron");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("app_current_user");
      if (saved === "Aaron" || saved === "Electra") {
        setCurrentUser(saved as User);
      }
    }
  }, []);

  const switchUser = (user: User) => {
    setCurrentUser(user);
    if (typeof window !== "undefined") {
      localStorage.setItem("app_current_user", user);
    }
  };

  return { currentUser, switchUser };
}

export default usePersistentAuth;
