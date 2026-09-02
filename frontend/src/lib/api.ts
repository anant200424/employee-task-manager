import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send the httpOnly refresh-token cookie
  headers: { "Content-Type": "application/json" },
});

let accessToken: string | null = null;
export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};
export const getAccessToken = (): string | null => accessToken;

api.interceptors.request.use((config) => {
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

export const refreshAccessToken = async (): Promise<string | null> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const res = await axios.post(
        `${BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      );
      const newToken = res.data?.data?.accessToken as string;
      const user = res.data?.data?.user;
      if (newToken) {
        setAccessToken(newToken);
        if (user && typeof window !== "undefined") {
          localStorage.setItem("nexus_user", JSON.stringify(user));
        }
        return newToken;
      }
      setAccessToken(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("nexus_user");
      }
      return null;
    } catch {
      setAccessToken(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("nexus_user");
      }
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If 403 or 401 with blocked account message, immediately clear session & logout
    if (error.response?.status === 403 || error.response?.status === 401) {
      const data = error.response?.data as any;
      const msg = String(data?.message || "").toLowerCase();
      if (
        msg.includes("blocked") ||
        msg.includes("deactivated") ||
        msg.includes("suspended")
      ) {
        setAccessToken(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("nexus_user");
          if (
            !window.location.pathname.includes("/login") &&
            !window.location.pathname.includes("/admin-login")
          ) {
            window.location.href = "/login?blocked=1";
          }
        }
        return Promise.reject(error);
      }
    }

    // Do not attempt refresh on the refresh endpoint itself
    if (originalRequest?.url?.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const newToken = await refreshAccessToken();
      if (newToken) {
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return api(originalRequest);
      }
    }

    return Promise.reject(error);
  },
);

export interface ApiErrorShape {
  message: string;
  errors?: Record<string, string>;
}

export const extractApiError = (error: unknown): ApiErrorShape => {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data as {
      message?: string;
      errors?: Record<string, string>;
    };
    return {
      message: data.message || "Something went wrong. Please try again.",
      errors: data.errors,
    };
  }
  return {
    message: "Network error. Please check your connection and try again.",
  };
};
