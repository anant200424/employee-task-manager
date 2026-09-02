"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { api, refreshAccessToken, setAccessToken } from "@/lib/api";
import { User } from "@/types/auth";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshSession: () => Promise<void>;
  setUser: (_user: User | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const getStoredUser = (): User | null => {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem("nexus_user");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

/**
 * Global authentication provider.
 * Manages user session state with instant local hydration, silent token refreshes, and instant fast transitions.
 * Wraps the entire application to provide auth context to all child components.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<User | null>(getStoredUser);
  const [isLoading, setIsLoading] = useState<boolean>(() => !getStoredUser());

  const setUser = useCallback((newUser: User | null) => {
    setUserState(newUser);
    if (typeof window !== "undefined") {
      if (newUser) {
        localStorage.setItem("nexus_user", JSON.stringify(newUser));
      } else {
        localStorage.removeItem("nexus_user");
      }
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const token = await refreshAccessToken();
      if (!token) {
        setUser(null);
        return;
      }

      const savedUser = getStoredUser();
      if (savedUser) {
        setUserState(savedUser);
      } else {
        const meRes = await api.get("/users/me");
        const freshUser = meRes.data?.data?.user || null;
        setUser(freshUser);
      }
    } catch {
      setUser(null);
      setAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, [setUser]);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  // Periodic and tab-focus check to enforce immediate logout if admin blocks employee
  useEffect(() => {
    if (!user) return;

    const verifyStatus = async () => {
      try {
        const res = await api.get("/users/me");
        const fresh = res.data?.data?.user;
        if (fresh?.isBlocked) {
          await logout();
          if (typeof window !== "undefined") {
            window.location.href = "/login?blocked=1";
          }
        }
      } catch (err: any) {
        if (err.response?.status === 403 || err.response?.status === 401) {
          const msg = String(err.response?.data?.message || "").toLowerCase();
          if (
            msg.includes("blocked") ||
            msg.includes("deactivated") ||
            msg.includes("suspended")
          ) {
            await logout();
            if (typeof window !== "undefined") {
              window.location.href = "/login?blocked=1";
            }
          }
        }
      }
    };

    window.addEventListener("focus", verifyStatus);
    const interval = setInterval(verifyStatus, 15000);
    return () => {
      window.removeEventListener("focus", verifyStatus);
      clearInterval(interval);
    };
  }, [user, logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        refreshSession,
        setUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
