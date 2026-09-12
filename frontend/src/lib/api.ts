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

// In-flight GET request deduplication cache to prevent identical parallel/StrictMode requests
const inFlightGetRequests = new Map<string, Promise<any>>();

const rawGet = api.get.bind(api);
api.get = ((url: string, config?: any): Promise<any> => {
  if (typeof window === "undefined" || (config?.headers as any)?.["x-skip-dedupe"]) {
    return rawGet(url, config);
  }
  const key = `${url}::${JSON.stringify(config?.params || {})}`;
  if (inFlightGetRequests.has(key)) {
    return inFlightGetRequests.get(key)!;
  }

  const promise = rawGet(url, config).finally(() => {
    // Keep in map for 400ms to coalesce concurrent component mounts and React Strict Mode double-invocations
    setTimeout(() => {
      inFlightGetRequests.delete(key);
    }, 400);
  });

  inFlightGetRequests.set(key, promise);
  return promise;
}) as any;

api.interceptors.request.use(async (config) => {
  // If a refresh is currently in flight, await it before proceeding
  if (refreshPromise) {
    try {
      await refreshPromise;
    } catch {
      // ignore
    }
  }

  if (accessToken && config.headers) {
    if (typeof (config.headers as any).set === "function") {
      (config.headers as any).set("Authorization", `Bearer ${accessToken}`);
    } else {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
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
      const user = res.data?.data?.user;
      const newToken = (res.data?.data?.accessToken as string) || "cookie_session";
      if (res.data?.data?.accessToken) {
        setAccessToken(res.data.data.accessToken);
      }
      if (user && typeof window !== "undefined") {
        localStorage.setItem("nexus_user", JSON.stringify(user));
      }
      return newToken;
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
          if (!window.location.pathname.includes("/login")) {
            window.location.href = "/login?blocked=1";
          }
        }
        return Promise.reject(error);
      }
    }

    // Do not attempt refresh on the refresh or logout endpoints
    if (
      originalRequest?.url?.includes("/auth/refresh") ||
      originalRequest?.url?.includes("/auth/logout")
    ) {
      return Promise.reject(error);
    }

    // If user has explicitly logged out (no nexus_user in storage and no token in memory), do not resurrect session
    const hasActiveSession =
      typeof window !== "undefined"
        ? Boolean(localStorage.getItem("nexus_user"))
        : Boolean(accessToken);

    if (!hasActiveSession) {
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
          if (typeof (originalRequest.headers as any).set === "function") {
            (originalRequest.headers as any).set("Authorization", `Bearer ${newToken}`);
          } else {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
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

/**
 * Enterprise Task API Client
 */
export const taskApi = {
  getTasks: (params?: Record<string, any>) =>
    api.get("/tasks", { params }).then((res) => res.data?.data?.tasks || []),
  createTask: (data: Record<string, any>) =>
    api.post("/tasks", data).then((res) => res.data?.data?.task),
  updateTask: (id: string, data: Record<string, any>) =>
    api.patch(`/tasks/${id}`, data).then((res) => res.data?.data?.task),
  deleteTask: (id: string) =>
    api.delete(`/tasks/${id}`).then((res) => res.data),
  restoreTask: (id: string) =>
    api.post(`/tasks/${id}/restore`).then((res) => res.data?.data?.task),
  addComment: (id: string, text: string) =>
    api.post(`/tasks/${id}/comments`, { text }).then((res) => res.data?.data?.comment),
  addChecklistItem: (id: string, title: string) =>
    api.post(`/tasks/${id}/checklist`, { title }).then((res) => res.data?.data),
  toggleChecklistItem: (id: string, itemId: string) =>
    api.patch(`/tasks/${id}/checklist/${itemId}`).then((res) => res.data?.data),
};

/**
 * Enterprise Audit API Client
 */
export const auditApi = {
  getAuditLogs: (params?: Record<string, any>) =>
    api.get("/audit-logs", { params }).then((res) => res.data?.data),
  getAuditActions: () =>
    api.get("/audit-logs/actions").then((res) => res.data?.data?.actions || []),
};

/**
 * Enterprise User Management API Client
 */
export const userAdminApi = {
  updateUserRole: (id: string, systemRole: string, roleTitle?: string) =>
    api.patch(`/users/${id}`, { systemRole, ...(roleTitle ? { role: roleTitle } : {}) }).then((res) => res.data?.data?.user),
};
