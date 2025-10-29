import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { BACKEND_BASE_URL, backendPath } from "./backend";
import { apiPath } from "../config/base-path";
import { setupRateLimitInterceptor } from "@/utils/rateLimitHandler";
import { csrfManager } from "../security/csrfManager";
import { detectIpBlock } from "@/utils/ipBlock";
import { config } from "../config/config";

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
});

// Setup rate limit interceptor for user-friendly notifications
if (typeof window !== "undefined") {
  setupRateLimitInterceptor(http);
}

// Simple client trace id for correlation
function genTraceId() {
  try {
    return (
      Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8)
    ).toUpperCase();
  } catch {
    return String(Date.now());
  }
}

// Request interceptor: attach CSRF header if available, set Content-Type, and add debug headers
http.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  // Block all requests if we're logging out (except logout and profile requests)
  if (
    isLoggingOut &&
    !config.url?.includes("/auth/logout") &&
    !config.url?.includes("/users/profile/me")
  ) {
    console.log("[Auth] Request blocked - logout in progress:", config.url);
    throw new Error("Logout in progress");
  }

  const h = (config.headers ||= ({} as any));

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

// ✅ IMPROVED: Simplified token refresh with single-flight pattern
let refreshPromise: Promise<void> | null = null;
let isLoggingOut = false; // Flag to prevent requests during logout/redirect

// Post-login grace window to avoid refresh/401 races during cookie propagation
let postLoginUntil = 0;
let lastLoginAt = 0;

// New: Be more conservative before calling server-side logout right after login
const MIN_LOGOUT_DELAY_MS = 8000; // was ~2000 via consumer; raise to 8s to avoid flapping

export function setPostLoginGrace(ms: number = 1500) {
  const now = Date.now();
  lastLoginAt = now;
  postLoginUntil = now + ms;
}

// Debug: Track when logout guard is set
if (typeof window !== "undefined") {
  Object.defineProperty(window, "isLoggingOut", {
    get() {
      return isLoggingOut;
    },
    set(value) {
      console.trace("[Auth] isLoggingOut set to:", value);
      isLoggingOut = value;
      (window as any).__isLoggingOut = value;
    },
    configurable: true,
  });
}

// Simplified cookie management for HTTP-only only approach
import { clearNonHttpOnlyCookies } from "../utils/cookieManager";
import { clearAuthCacheOnFail } from "../auth";

// Expose globally for debugging and coordination
if (typeof window !== "undefined") {
  (window as any).__clearNonHttpOnlyCookies = clearNonHttpOnlyCookies;
  (window as any).__isLoggingOut = false; // Shared flag across all modules
  console.log(
    "[Auth] Debug: window.__clearNonHttpOnlyCookies() available for manual cleanup",
  );
}

// Expose a safe reset for the logout guard (used after successful login)
export function clearLogoutGuard() {
  isLoggingOut = false;
  if (typeof window !== "undefined") {
    (window as any).__isLoggingOut = false;
  }
}

// ✅ IMPROVED: Simplified token refresh with single-flight pattern
export async function refreshTokens(): Promise<void> {
  // If refresh already in progress, wait for it
  if (refreshPromise) {
    return refreshPromise;
  }

  // Start new refresh
  refreshPromise = (async () => {
    try {
      console.log("[Auth] 🔄 Starting token refresh...");

      // Get CSRF token
      const csrf = await getCsrfToken();

      // Call refresh endpoint
      const resp = await fetch(apiPath("/auth/refresh"), {
        method: "POST",
        credentials: "include", // Critical: Include HTTP-only cookies
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrf,
          "X-Debug-Source": "httpClient.refresh",
          "X-Debug-Trace": genTraceId(),
        },
        body: JSON.stringify({}),
      });

      if (!resp.ok) {
        throw new Error(`Refresh failed: ${resp.status}`);
      }

      console.log("[Auth] ✅ Token refresh successful");
    } catch (err) {
      console.log("[Auth] ❌ Refresh error:", err);

      // Clear caches on failure
      clearNonHttpOnlyCookies();
      clearCsrfCache();
      clearAuthCacheOnFail();

      // Handle refresh failure (redirect; gate server logout separately)
      await handleRefreshFailure(401);

      throw err;
    } finally {
      // Clear promise after 1 second to allow new refreshes
      setTimeout(() => {
        refreshPromise = null;
      }, 1000);
    }
  })();

  return refreshPromise;
}

/**
 * Verify with the server whether the session is really invalid before logging out.
 * Returns true when server confirms invalid, false if still valid or inconclusive.
 */
async function confirmInvalidSession(): Promise<boolean> {
  try {
    const res = await fetch(apiPath("/auth/validate?include=user"), {
      method: "GET",
      credentials: "include",
      headers: { "X-Skip-Auth-Refresh": "true", "X-Debug-Source": "httpClient.confirmInvalid" },
      cache: "no-store",
    });
    if (!res.ok) return true; // treat 4xx/5xx as invalid
    const data = await res.json().catch(() => ({}));
    // Accept both shapes: { success:true, data:{ valid:boolean } } OR minimal boolean
    const valid = !!(data?.data?.valid ?? data?.valid);
    return !valid;
  } catch (e) {
    // Network errors → do not aggressively logout the server; just redirect client
    return false;
  }
}

/**
 * Handle refresh token failure by redirecting to login.
 * Only call server-side logout when we are confident the session is invalid
 * and we are past a conservative post-login window.
 */
async function handleRefreshFailure(status: number): Promise<void> {
  // Prevent multiple simultaneous flows
  if (isLoggingOut) {
    console.log("[Auth] Request blocked - logout in progress");
    throw new Error("Logout in progress");
  }

  console.log(
    `[Auth] ❌ Refresh failed with status ${status} - redirecting`,
  );

  // Clear non-HTTP-only cookies and CSRF cache
  clearNonHttpOnlyCookies();
  clearCsrfCache();

  // Clear Zustand auth store to remove persisted state from localStorage
  try {
    const { useAuthSessionStore } = await import("@/stores/session-store");
    useAuthSessionStore.getState().logout();
    console.log("[Auth] Zustand auth store cleared");
  } catch (e) {
    console.warn("[Auth] Failed to clear Zustand store:", e);
  }

  // Gate server-side logout to avoid self-sabotage right after login
  const elapsedSinceLogin = Date.now() - lastLoginAt;
  const pastConservativeWindow = elapsedSinceLogin >= MIN_LOGOUT_DELAY_MS;

  let serverThinksInvalid = false;
  if (pastConservativeWindow) {
    // Confirm with server once before blacklisting tokens via /logout
    serverThinksInvalid = await confirmInvalidSession();
  }

  if (pastConservativeWindow && serverThinksInvalid) {
    isLoggingOut = true;
    if (typeof window !== "undefined") {
      (window as any).__isLoggingOut = true;
    }
    try {
      // Get CSRF token for logout
      const getCsrfToken = (): string | null => {
        if (typeof document === 'undefined') return null;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; XSRF-TOKEN=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
        return null;
      };
      
      const csrfToken = getCsrfToken();
      const headers: Record<string, string> = {
        "X-Skip-Auth-Refresh": "true",
        "X-Debug-Source": "httpClient.handleRefreshFailure",
        "X-Debug-Trace": genTraceId(),
      };
      
      if (csrfToken) {
        headers["X-CSRF-Token"] = csrfToken;
      }
      
      await fetch("/api/v1/auth/logout", {
        method: "POST",
        credentials: "include",
        headers,
      });
      console.log("[Auth] Backend logout successful");
    } catch (logoutError) {
      console.warn("[Auth] Backend logout failed (continuing anyway):", logoutError);
    }
  } else {
    if (!pastConservativeWindow) {
      console.log(
        "[Auth] Skipping backend logout during extended post-login window (",
        `${elapsedSinceLogin}ms < ${MIN_LOGOUT_DELAY_MS}ms)`,
      );
    } else {
      console.log(
        "[Auth] Skipping backend logout: server still considers session valid",
      );
    }
  }

  // Redirect to login page immediately
  if (typeof window !== "undefined") {
    console.log("[Auth] 🚪 Redirecting to login - session invalidated or refresh failed");
    window.location.href =
      "/login?reason=session_expired&message=" +
      encodeURIComponent("Your session has expired. Please log in again.");
  }
}

http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = (error.config as (AxiosRequestConfig & {
      _retry?: boolean;
      _skipAuthRefresh?: boolean;
      _graceRetry?: boolean; // retry once within post-login grace
      _didRefreshAfterGrace?: boolean; // attempted refresh after grace retry
    })) || undefined;
    const status = error.response?.status;
    const data = error.response?.data as any;

    // Guard: if no config, reject immediately
    if (!original) {
      return Promise.reject(error);
    }

    // Precompute logout/refresh detection
    const isLogoutOrRefresh =
      original.url?.includes("/auth/logout") ||
      original.url?.includes("/auth/refresh") ||
      (original.headers as any)?.["X-Skip-Auth-Refresh"] === "true";

    // (EBADCSRFTOKEN handling consolidated below)

    // If we're in the process of logging out, reject all requests immediately
    if (isLoggingOut) {
      console.log("[Auth] Request blocked - logout in progress");
      return Promise.reject(new Error("Logout in progress"));
    }

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
            "[httpClient] Already on IP blocked page, not redirecting",
          );
          return Promise.reject(error);
        }
        if ((window as any).__redirectingToIPBlocked) {
          console.log(
            "[httpClient] Already redirecting to IP blocked page, skipping",
          );
          return Promise.reject(error);
        }
        (window as any).__redirectingToIPBlocked = true;

        const params = new URLSearchParams(resIp.params!);
        console.log(
          "[httpClient] Redirecting to /ip-blocked with params:",
          params.toString(),
        );
        setTimeout(() => {
          window.location.href = `/ip-blocked?${params.toString()}`;
        }, 100);
      }
      return Promise.reject(error);
    }

    // Skip auth refresh for logout and refresh endpoints, or if header says to skip

    // CSRF error handling: if 403 with EBADCSRFTOKEN, fetch new token then retry once
    if (
      status === 403 &&
      (error.response?.data as any)?.error?.code === "EBADCSRFTOKEN" &&
      !original._retry &&
      !isLogoutOrRefresh
    ) {
      original._retry = true;
      try {
        clearCsrfCache();
        await getCsrfToken();
        return http.request(original);
      } catch (e) {
        return Promise.reject(e);
      }
    }

    // Auth handling: attempt refresh on 401 once (but skip for logout/refresh endpoints)
    if (
      status === 401 &&
      !original._retry &&
      !isLogoutOrRefresh &&
      !original._skipAuthRefresh
    ) {
      // Suppress refresh during short post-login window to avoid race with cookie propagation
      if (Date.now() < postLoginUntil) {
        const delay = 400 + Math.floor(Math.random() * 300); // 400–700ms jitter
        console.log(
          "[Auth] 401 within post-login grace; retrying once after",
          delay,
          "ms",
          {
            url: original.url,
          },
        );
        original._retry = true;
        (original as any)._graceRetry = true;
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            http
              .request(original)
              .then(resolve)
              .catch(reject);
          }, delay);
        });
      }

      console.log(
        "[Auth] 401 from:",
        original.url,
        "src:",
        (original.headers as any)?.["X-Debug-Source"],
      );
      original._retry = true;
      console.log("[Auth] Received 401, attempting HTTP-only refresh...", {
        url: original.url,
        src: (original.headers as any)?.["X-Debug-Source"],
      });
      try {
        await refreshTokens();
        console.log(
          "[Auth] HTTP-only refresh succeeded, retrying original request",
          {
            url: original.url,
            src: (original.headers as any)?.["X-Debug-Source"],
          },
        );
        return http.request(original);
      } catch (refreshError) {
        // Refresh failed - non-HTTP-only cookies should already be cleared by refreshTokens()
        console.log(
          "[Auth] HTTP-only refresh failed, non-HTTP-only cookies cleared",
          {
            url: original.url,
            src: (original.headers as any)?.["X-Debug-Source"],
          },
        );
        return Promise.reject(refreshError);
      }
    }

    // If this is a 401 and we already tried once
    if (status === 401 && original._retry && !isLogoutOrRefresh) {
      // Special case: if the 401 happened right after a post-login grace retry,
      // attempt ONE refresh before logging out to avoid false logouts from stale caches
      if ((original as any)._graceRetry && !(original as any)._didRefreshAfterGrace) {
        try {
          (original as any)._didRefreshAfterGrace = true;
          console.log(
            "[Auth] 401 after grace retry; attempting one refresh before logout",
            {
              url: original.url,
            },
          );
          await refreshTokens();
          return http.request(original);
        } catch (e) {
          // fall through to logout below
        }
      }

      console.log(
        "[Auth] Received 401 after retry attempt - session invalidated, logging out",
      );
      // CRITICAL: Clear React Query cache before logout to prevent stale error states
      // This prevents old 401 errors from blocking new API calls after re-login
      clearAuthCacheOnFail();
      // Call handleRefreshFailure to properly logout and redirect
      await handleRefreshFailure(status);
      return Promise.reject(new Error("Session invalidated"));
    }

    return Promise.reject(error);
  },
);

// Create a dedicated axios instance for direct backend communication
export const backendHttp: AxiosInstance = axios.create({
  baseURL: config.apiUrl,
  withCredentials: true, // send cookies for auth
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-CSRF-Token",
});

// Setup rate limit interceptor for backend HTTP client
if (typeof window !== "undefined") {
  setupRateLimitInterceptor(backendHttp);
}

// Request interceptor for backend HTTP client
backendHttp.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  // Block all requests if we're logging out (except logout itself)
  if (isLoggingOut && !config.url?.includes("/auth/logout")) {
    console.log(
      "[BackendHttp] Request blocked - logout in progress:",
      config.url,
    );
    throw new Error("Logout in progress");
  }

  const h = (config.headers ||= ({} as any));
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
});

// Response interceptor for backend HTTP client (similar to main http client)
backendHttp.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = (error.config as AxiosRequestConfig & {
      _retry?: boolean;
      _skipAuthRefresh?: boolean;
    }) || undefined;
    const status = error.response?.status;
    const data = error.response?.data as any;

    // Guard: if no config, reject immediately
    if (!original) {
      return Promise.reject(error);
    }

    const isLogoutOrRefresh =
      original.url?.includes("/auth/logout") ||
      original.url?.includes("/auth/refresh") ||
      (original.headers as any)?.["X-Skip-Auth-Refresh"] === "true";

    // If we're in the process of logging out, reject all requests immediately
    if (isLoggingOut) {
      console.log("[BackendHttp] Request blocked - logout in progress");
      return Promise.reject(new Error("Logout in progress"));
    }

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
            "[BackendHttp] Already on IP blocked page, not redirecting",
          );
          return Promise.reject(error);
        }
        if ((window as any).__redirectingToIPBlocked) {
          console.log(
            "[BackendHttp] Already redirecting to IP blocked page, skipping",
          );
          return Promise.reject(error);
        }
        (window as any).__redirectingToIPBlocked = true;
        const params = new URLSearchParams(resIp.params!);
        console.log(
          "[BackendHttp] Redirecting to /ip-blocked with params:",
          params.toString(),
        );
        setTimeout(() => {
          window.location.href = `/ip-blocked?${params.toString()}`;
        }, 100);
      }
      return Promise.reject(error);
    }

    // Handle authentication errors
    if (
      status === 401 &&
      !original._retry &&
      !isLogoutOrRefresh &&
      !original._skipAuthRefresh
    ) {
      console.log("[BackendHttp] 401 from:", original.url);
      original._retry = true;
      try {
        await refreshTokens();
        console.log(
          "[BackendHttp] Token refresh succeeded, retrying original request",
        );
        return backendHttp.request(original);
      } catch (refreshError) {
        console.log("[BackendHttp] Token refresh failed");
        return Promise.reject(refreshError);
      }
    }

    // If this is a 401 and we already tried refresh, session is truly invalid
    if (status === 401 && original._retry && !isLogoutOrRefresh) {
      console.log(
        "[BackendHttp] Received 401 after retry - session invalidated",
      );
      clearAuthCacheOnFail();
      await handleRefreshFailure(status);
      return Promise.reject(new Error("Session invalidated"));
    }

    return Promise.reject(error);
  },
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
