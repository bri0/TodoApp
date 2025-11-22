import { useEffect, useRef } from "react";
import { defaultUser } from "../constants/defaultUser";
import { useStorageState } from "../hooks/useStorageState";
import { User } from "../types/user";
import { UserContext } from "./UserContext";
import { autoSync } from "../utils/autoSync";

export const UserContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useStorageState<User>(defaultUser, "user");
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip auto-sync on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Auto-sync when tasks or categories change
    autoSync(user, setUser);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.tasks, user.categories]);

  return <UserContext.Provider value={{ user, setUser }}>{children}</UserContext.Provider>;
};
