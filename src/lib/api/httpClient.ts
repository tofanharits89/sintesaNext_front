import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { config, backendPath } from "../config/config";
import { apiPath } from "../config/base-path";
import { setupRateLimitInterceptor } from "@/utils/rateLimitHandler";
import { csrfManager } from "../security/csrfManager";
import { detectIpBlock } from "@/utils/ipBlock";

// Utilities to read cookies in browser
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${encodeURIComponent(name)}=`));
  if (!value) return null;
  return decodeURIComponent(value.split("=")[1] || "");
}

// CSRF token management: delegate to unified csrfManager (no behavior change)
async function getCsrfToken(): Promise<string> {
  return csrfManager.getCSRFToken();
}

export function clearCsrfCache() {
  csrfManager.clearCache();
}

export async function prefetchCsrf(): Promise<void> {
  await csrfManager.getCSRFToken();
}

export async function refreshCsrf(): Promise<void> {
  await csrfManager.refreshToken();
}

// Create a shared Axios instance
// Option A: route all browser HTTP calls through same-origin Next API
// Use an empty baseURL so absolute paths like "/v3/next/api/..." resolve on the current origin
export const http: AxiosInstance = axios.create({
  baseURL: "",
  withCredentials: true, // send cookies for auth and CSRF
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-CSRF-Token",
  // Keep browser-side requests open long enough to match the Python RAG backend (180s)
  timeout: Number(process.env.NEXT_PUBLIC_HTTP_TIMEOUT_MS || 180_000),
});

// Setup rate limit interceptor for user-friendly notifications
if (typeof window !== "undefined") {
  setupRateLimitInterceptor(http);
}

// Simple client trace id for correlation
function genTraceId() {
  try {
    return (
      Date.now().toString(36) +
      "-" +
      Math.random().toString(36).slice(2, 8)
    ).toUpperCase();
  } catch {
    return String(Date.now());
  }
}

// Request interceptor: attach CSRF header if available, set Content-Type, and add debug headers
http.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const h = (config.headers ||= {} as any);

  // Correlation headers
  if (!h["X-Debug-Trace"]) h["X-Debug-Trace"] = genTraceId();
  if (!h["X-Debug-Source"]) h["X-Debug-Source"] = "httpClient";

  const method = (config.method || "get").toLowerCase();

  // Set Content-Type to application/json for non-FormData requests
  if (["post", "put", "patch", "delete"].includes(method)) {
    // Only set Content-Type if it's not FormData (let browser set multipart/form-data)
    if (!(config.data instanceof FormData) && !h["Content-Type"]) {
      h["Content-Type"] = "application/json";
    }

    // ✅ IMPROVED: Simplified CSRF token attachment
    try {
      const csrf = await getCsrfToken();
      h["X-CSRF-Token"] = csrf;
    } catch (error) {
      console.warn("[CSRF] Failed to get token:", error);
      // Try cookie fallback
      const cookieCsrf = getCookie("XSRF-TOKEN");
      if (cookieCsrf) {
        h["X-CSRF-Token"] = cookieCsrf;
      }
    }
  }
  return config;
});

// No client-side refresh/logout guards in single-session model

// Simplified cookie management for HTTP-only only approach
import { clearNonHttpOnlyCookies } from "../utils/cookieManager";

// Expose globally for debugging and coordination
if (typeof window !== "undefined") {
  (window as any).__clearNonHttpOnlyCookies = clearNonHttpOnlyCookies;
}

// Expose a safe reset for the logout guard (used after successful login)
export function clearLogoutGuard() {
  /* no-op */
}

// ✅ IMPROVED: Simplified token refresh with single-flight pattern
// refreshTokens removed

/**
 * Verify with the server whether the session is really invalid before logging out.
 * Returns true when server confirms invalid, false if still valid or inconclusive.
 */
// confirmInvalidSession removed

/**
 * Handle refresh token failure by redirecting to login.
 * Only call server-side logout when we are confident the session is invalid
 * and we are past a conservative post-login window.
 */
// handleRefreshFailure removed

http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original =
      (error.config as AxiosRequestConfig & {
        _retry?: boolean;
        _skipAuthRefresh?: boolean;
        _graceRetry?: boolean; // retry once within post-login grace
        _didRefreshAfterGrace?: boolean; // attempted refresh after grace retry
      }) || undefined;
    const status = error.response?.status;
    const data = error.response?.data as any;

    // Guard: if no config, reject immediately
    if (!original) {
      return Promise.reject(error);
    }

    // Precompute logout/refresh detection
    const isLogoutOrRefresh = original.url?.includes("/auth/logout");

    // (EBADCSRFTOKEN handling consolidated below)

    // If we're in the process of logging out, reject all requests immediately
    // no logout guard

    // Handle IP blocking - redirect to dedicated page
    // Log 403 errors for debugging
    if (status === 403) {
      const dbgError =
        data && typeof data === "object" && "data" in (data as any)
          ? (data as any).data?.error ?? (data as any).error
          : (data as any)?.error;
      const dbgCode =
        data && typeof data === "object" && "data" in (data as any)
          ? (data as any).data?.code ?? (data as any).code
          : (data as any)?.code;
      console.log("[httpClient] 403 error detected:", {
        url: original.url,
        data,
        hasCode: !!dbgCode,
        code: dbgCode,
        error: dbgError,
      });
    }

    // Check for IP_BLOCKED code OR any 403 with "blocked" in error message
    // OR just assume any 403 is IP block (since that's the most common case)
    // Unwrap nested shapes: { success:false, data:{...} }
    const body: any =
      data &&
      typeof data === "object" &&
      "data" in data &&
      typeof (data as any).data === "object"
        ? (data as any).data
        : data;

    const resIp =
      status === 403 ? detectIpBlock(body) : { ipBlocked: false as const };
    if (resIp.ipBlocked) {
      console.log("[httpClient] IP blocked detected");

      if (typeof window !== "undefined") {
        if (window.location.pathname.includes("/ip-blocked")) {
          console.log(
            "[httpClient] Already on IP blocked page, not redirecting"
          );
          return Promise.reject(error);
        }
        if ((window as any).__redirectingToIPBlocked) {
          console.log(
            "[httpClient] Already redirecting to IP blocked page, skipping"
          );
          return Promise.reject(error);
        }
        (window as any).__redirectingToIPBlocked = true;

        const params = new URLSearchParams(resIp.params!);
        console.log(
          "[httpClient] Redirecting to /ip-blocked with params:",
          params.toString()
        );
        setTimeout(() => {
          window.location.href = `/ip-blocked?${params.toString()}`;
        }, 100);
      }
      return Promise.reject(error);
    }

    // Skip auth refresh for logout and refresh endpoints, or if header says to skip

    // CSRF error handling: if 403 with EBADCSRFTOKEN, fetch new token then retry once
    // CSRF error handling: if 403 with EBADCSRFTOKEN, fetch new token then retry once
    // Simplified: Just clear cache and retry. The getCsrfToken() call in the retry will handle fetching.
    if (
      status === 403 &&
      (error.response?.data as any)?.error?.code === "EBADCSRFTOKEN" &&
      !original._retry &&
      !isLogoutOrRefresh
    ) {
      original._retry = true;
      clearCsrfCache();
      // We don't need to explicitly await getCsrfToken() here because the request interceptor
      // will call it when we retry the request.
      return http.request(original);
    }

    if (status === 401 && !isLogoutOrRefresh) {
      clearNonHttpOnlyCookies();
      clearCsrfCache();
      // Cache clearing handled by useAuth hook
      if (typeof window !== "undefined") {
        window.location.href = "/login?reason=session_expired";
      }
      return Promise.reject(error);
    }

    // no second stage handling

    return Promise.reject(error);
  }
);

// Create a dedicated axios instance for direct backend communication
export const backendHttp: AxiosInstance = axios.create({
  baseURL: config.apiUrl,
  withCredentials: true, // send cookies for auth
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-CSRF-Token",
  // Allow long-running RAG responses (align with backend/Python 180s)
  timeout: Number(process.env.NEXT_PUBLIC_BACKEND_HTTP_TIMEOUT_MS || 180_000),
});

// Setup rate limit interceptor for backend HTTP client
if (typeof window !== "undefined") {
  setupRateLimitInterceptor(backendHttp);
}

// Request interceptor for backend HTTP client
backendHttp.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const h = (config.headers ||= {} as any);
    if (!h["X-Debug-Trace"]) h["X-Debug-Trace"] = genTraceId();
    if (!h["X-Debug-Source"]) h["X-Debug-Source"] = "backendHttp";

    const method = (config.method || "get").toLowerCase();

    // Set Content-Type to application/json for non-FormData requests
    if (["post", "put", "patch", "delete"].includes(method)) {
      // Only set Content-Type if it's not FormData (let browser set multipart/form-data)
      if (!(config.data instanceof FormData) && !h["Content-Type"]) {
        h["Content-Type"] = "application/json";
      }

      // For direct backend calls, we need to handle CSRF differently
      // Since we're not going through Next.js, we'll rely on cookie-based CSRF
      try {
        const cookieCsrf = getCookie("XSRF-TOKEN");
        if (cookieCsrf) {
          h["X-CSRF-Token"] = cookieCsrf;
        }
      } catch (error) {
        console.warn("[BackendHttp] CSRF token fetch failed:", error);
      }
    }
    return config;
  }
);

// Response interceptor for backend HTTP client (similar to main http client)
backendHttp.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original =
      (error.config as AxiosRequestConfig & {
        _retry?: boolean;
        _skipAuthRefresh?: boolean;
      }) || undefined;
    const status = error.response?.status;
    const data = error.response?.data as any;

    // Guard: if no config, reject immediately
    if (!original) {
      return Promise.reject(error);
    }

    const isLogoutOrRefresh = original.url?.includes("/auth/logout");

    // no logout guard

    // Handle IP blocking
    const body: any =
      data &&
      typeof data === "object" &&
      "data" in data &&
      typeof (data as any).data === "object"
        ? (data as any).data
        : data;
    const resIp =
      status === 403 ? detectIpBlock(body) : { ipBlocked: false as const };
    if (resIp.ipBlocked) {
      console.log("[BackendHttp] IP blocked detected");
      if (typeof window !== "undefined") {
        if (window.location.pathname.includes("/ip-blocked")) {
          console.log(
            "[BackendHttp] Already on IP blocked page, not redirecting"
          );
          return Promise.reject(error);
        }
        if ((window as any).__redirectingToIPBlocked) {
          console.log(
            "[BackendHttp] Already redirecting to IP blocked page, skipping"
          );
          return Promise.reject(error);
        }
        (window as any).__redirectingToIPBlocked = true;
        const params = new URLSearchParams(resIp.params!);
        console.log(
          "[BackendHttp] Redirecting to /ip-blocked with params:",
          params.toString()
        );
        setTimeout(() => {
          window.location.href = `/ip-blocked?${params.toString()}`;
        }, 100);
      }
      return Promise.reject(error);
    }

    if (status === 401 && !isLogoutOrRefresh) {
      // Cache clearing handled by useAuth hook
      if (typeof window !== "undefined") {
        window.location.href = "/login?reason=session_expired";
      }
      return Promise.reject(new Error("Session invalidated"));
    }

    return Promise.reject(error);
  }
);

// Convenience helpers mirroring fetch-like API
export const apiClient = {
  get: <T = any>(path: string, config?: AxiosRequestConfig) =>
    http.get<T>(apiPath(path), config).then((r) => r.data),
  post: <T = any>(path: string, data?: any, config?: AxiosRequestConfig) =>
    http.post<T>(apiPath(path), data, config).then((r) => r.data),
  put: <T = any>(path: string, data?: any, config?: AxiosRequestConfig) =>
    http.put<T>(apiPath(path), data, config).then((r) => r.data),
  delete: <T = any>(path: string, config?: AxiosRequestConfig) =>
    http.delete<T>(apiPath(path), config).then((r) => r.data),
};

// Direct backend client for bypassing Next.js proxy
export const directBackendClient = {
  get: <T = any>(path: string, config?: AxiosRequestConfig) =>
    backendHttp.get<T>(path, config).then((r) => r.data),
  post: <T = any>(path: string, data?: any, config?: AxiosRequestConfig) =>
    backendHttp.post<T>(path, data, config).then((r) => r.data),
  put: <T = any>(path: string, data?: any, config?: AxiosRequestConfig) =>
    backendHttp.put<T>(path, data, config).then((r) => r.data),
  delete: <T = any>(path: string, config?: AxiosRequestConfig) =>
    backendHttp.delete<T>(path, config).then((r) => r.data),
};
