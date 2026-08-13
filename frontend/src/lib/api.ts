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

const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const res = await axios.post(
      `${BASE_URL}/auth/refresh`,
      {},
      { withCredentials: true }
    );
    const newToken = res.data?.data?.accessToken as string;
    setAccessToken(newToken);
    return newToken;
  } catch {
    setAccessToken(null);
    return null;
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newToken = await refreshPromise;
      if (newToken && originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

export interface ApiErrorShape {
  message: string;
  errors?: Record<string, string>;
}

export const extractApiError = (error: unknown): ApiErrorShape => {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data as { message?: string; errors?: Record<string, string> };
    return {
      message: data.message || "Something went wrong. Please try again.",
      errors: data.errors,
    };
  }
  return { message: "Network error. Please check your connection and try again." };
};
