import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { BACKEND_BASE_URL, backendPath } from "./backend";
import { apiPath } from "./base-path";

// Utilities to read cookies in browser
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${encodeURIComponent(name)}=`));
  if (!value) return null;
  return decodeURIComponent(value.split("=")[1] || "");
}

// Public helper to proactively fetch CSRF token
export async function prefetchCsrf(): Promise<void> {
  await ensureCsrfToken(http);
}

let lastCsrfToken: string | null = null;

// Force-fetch a fresh CSRF token (useful before critical POSTs like login/refresh)
export async function refreshCsrf(): Promise<void> {
  try {
    // Use same-origin Next API to avoid third-party cookie issues
    const resp = await fetch(apiPath("/csrf-token"), {
      credentials: "include",
      cache: "no-store",
    });
    const data = await resp.json().catch(() => ({}));
    const token = (data as any)?.token;
    if (token) lastCsrfToken = token as string;
  } catch (e) {
    // ignore
  }
}

async function ensureCsrfToken(instance: AxiosInstance) {
  // If no CSRF cookie yet, fetch it from the backend route
  const xsrfCookie = getCookie("XSRF-TOKEN");
  if (!xsrfCookie) {
    try {
      // Call same-origin proxy which forwards cookies and Set-Cookie
      const resp = await fetch(apiPath("/csrf-token"), {
        credentials: "include",
        cache: "no-store",
      });
      const data = await resp.json().catch(() => ({}));
      const token = (data as any)?.token;
      if (token) lastCsrfToken = token as string;
    } catch (e) {
      // ignore, backend will set token on next protected route
    }
  }
}

// Create a shared Axios instance
export const http: AxiosInstance = axios.create({
  baseURL: BACKEND_BASE_URL,
  withCredentials: true, // send cookies for auth and CSRF
  headers: {
    "Content-Type": "application/json",
  },
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-CSRF-Token",
});

// Request interceptor: attach CSRF header if available
http.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  // Only attach CSRF for state-changing methods
  const method = (config.method || "get").toLowerCase();
  if (["post", "put", "patch", "delete"].includes(method)) {
    let csrf = getCookie("XSRF-TOKEN") || lastCsrfToken;
    if (!csrf) {
      await ensureCsrfToken(http);
      csrf = getCookie("XSRF-TOKEN") || lastCsrfToken;
    }
    if (csrf) {
      // Server accepts multiple header names; use a canonical one
      const h = (config.headers ||= {} as any);
      (h as any)["X-CSRF-Token"] = csrf;
    }
  }
  return config;
});

// Response interceptor: handle 401 by attempting refresh, then retry once
let isRefreshing = false;
let pendingQueue: Array<{ resolve: () => void; reject: (e: any) => void }> = [];

function processQueue(error: any | null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  pendingQueue = [];
}

async function refreshTokens(): Promise<void> {
  if (isRefreshing) {
    return new Promise<void>((resolve, reject) => {
      pendingQueue.push({ resolve, reject });
    });
  }
  isRefreshing = true;
  try {
    // Proactively ensure we have a CSRF token before hitting refresh endpoint
    await ensureCsrfToken(http);
    // Call same-origin Next API which proxies to backend and forwards cookies/CSRF
    const csrf = getCookie("XSRF-TOKEN") || lastCsrfToken;
    const resp = await fetch(apiPath("/auth/refresh"), {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(csrf ? { "X-CSRF-Token": String(csrf) } : {}),
      },
      body: JSON.stringify({}),
    });
    if (!resp.ok) {
      // If CSRF failed, try once more after forcing token fetch
      if (resp.status === 403) {
        await ensureCsrfToken(http);
        const csrf2 = getCookie("XSRF-TOKEN") || lastCsrfToken;
        const retry = await fetch(apiPath("/auth/refresh"), {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(csrf2 ? { "X-CSRF-Token": String(csrf2) } : {}),
          },
          body: JSON.stringify({}),
        });
        if (!retry.ok) throw new Error(`Refresh failed: ${retry.status}`);
      } else {
        throw new Error(`Refresh failed: ${resp.status}`);
      }
    }
    processQueue(null);
  } catch (err) {
    processQueue(err);
    throw err;
  } finally {
    isRefreshing = false;
  }
}

http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;

    // CSRF error handling: if 403 with EBADCSRFTOKEN, fetch new token then retry once
    if (
      status === 403 &&
      (error.response?.data as any)?.error?.code === "EBADCSRFTOKEN" &&
      !original._retry
    ) {
      original._retry = true;
      try {
        await ensureCsrfToken(http);
        return http.request(original);
      } catch (e) {
        return Promise.reject(e);
      }
    }

    // Auth handling: attempt refresh on 401 once
    if (status === 401 && !original._retry) {
      original._retry = true;
      try {
        await refreshTokens();
        return http.request(original);
      } catch (e) {
        return Promise.reject(e);
      }
    }

    return Promise.reject(error);
  }
);

// Convenience helpers mirroring fetch-like API
export const apiClient = {
  get: <T = any>(path: string, config?: AxiosRequestConfig) =>
    http.get<T>(backendPath(path), config).then((r) => r.data),
  post: <T = any>(path: string, data?: any, config?: AxiosRequestConfig) =>
    http.post<T>(backendPath(path), data, config).then((r) => r.data),
  put: <T = any>(path: string, data?: any, config?: AxiosRequestConfig) =>
    http.put<T>(backendPath(path), data, config).then((r) => r.data),
  delete: <T = any>(path: string, config?: AxiosRequestConfig) =>
    http.delete<T>(backendPath(path), config).then((r) => r.data),
};
