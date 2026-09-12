"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
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
        document.cookie = "nexus_session=1; path=/; max-age=604800; SameSite=Lax";
      } else {
        localStorage.removeItem("nexus_user");
        localStorage.removeItem("nexus_cached_tasks");
        document.cookie = "nexus_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
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
        if (typeof window !== "undefined") {
          document.cookie = "nexus_session=1; path=/; max-age=604800; SameSite=Lax";
        }
      }
      try {
        const meRes = await api.get("/users/me");
        const freshUser = meRes.data?.data?.user || null;
        if (freshUser) {
          setUser(freshUser);
        }
      } catch {
        if (!savedUser) {
          setUser(null);
        }
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
    } catch (err) {
      console.warn("Server logout notification:", err);
    } finally {
      setAccessToken(null);
      setUserState(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("nexus_user");
        localStorage.removeItem("nexus_cached_tasks");
        sessionStorage.clear();
        document.cookie = "nexus_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
        window.location.replace("/login");
      }
    }
  }, []);

  // Multi-tab synchronization: if any tab logs out, sync immediately
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "nexus_user") {
        if (!e.newValue) {
          setAccessToken(null);
          setUserState(null);
          if (typeof window !== "undefined") {
            document.cookie = "nexus_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
            const path = window.location.pathname;
            const isPublicAuth =
              path.startsWith("/login") ||
              path === "/" ||
              path.startsWith("/home") ||
              path.startsWith("/register") ||
              path.startsWith("/forgot-password") ||
              path.startsWith("/reset-password");
            if (!isPublicAuth) {
              window.location.replace("/login");
            }
          }
        } else {
          try {
            const parsed = JSON.parse(e.newValue);
            setUserState(parsed);
            if (typeof window !== "undefined") {
              document.cookie = "nexus_session=1; path=/; max-age=604800; SameSite=Lax";
            }
          } catch {
            // ignore
          }
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const isInitialRefreshDone = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = getStoredUser();
      if (saved) {
        document.cookie = "nexus_session=1; path=/; max-age=604800; SameSite=Lax";
      } else {
        document.cookie = "nexus_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
      }
    }
    if (!isInitialRefreshDone.current) {
      isInitialRefreshDone.current = true;
      refreshSession();
    }
  }, [refreshSession]);



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
