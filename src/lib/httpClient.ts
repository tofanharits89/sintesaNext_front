import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { BACKEND_BASE_URL, backendPath } from "./backend";
import { apiPath } from "./base-path";
import { setupRateLimitInterceptor } from "@/utils/rateLimitHandler";
import { csrfManager } from "./csrfManager";
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

// Request interceptor: attach CSRF header if available and set Content-Type
http.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  // Block all requests if we're logging out (except logout itself)
  if (isLoggingOut && !config.url?.includes("/auth/logout")) {
    console.log("[Auth] Request blocked - logout in progress:", config.url);
    throw new Error("Logout in progress");
  }

  const method = (config.method || "get").toLowerCase();

  // Set Content-Type to application/json for non-FormData requests
  if (["post", "put", "patch", "delete"].includes(method)) {
    const h = (config.headers ||= {} as any);

    // Only set Content-Type if it's not FormData (let browser set multipart/form-data)
    if (!(config.data instanceof FormData) && !h["Content-Type"]) {
      h["Content-Type"] = "application/json";
    }

    // Attach CSRF token for state-changing methods using unified manager
    try {
      await csrfManager.attachCSRFToken(h);
    } catch (error) {
      console.warn("[CSRF] Failed to attach token:", error);
      // Fallback to cookie-based approach
      let csrf = getCookie("XSRF-TOKEN") || lastCsrfToken;
      if (!csrf) {
        await ensureCsrfToken(http);
        csrf = getCookie("XSRF-TOKEN") || lastCsrfToken;
      }
      if (csrf) {
        h["X-CSRF-Token"] = csrf;
      }
    }
  }
  return config;
});

// Response interceptor: handle 401 by attempting refresh, then retry once
let isRefreshing = false;
let pendingQueue: Array<{ resolve: () => void; reject: (e: any) => void }> = [];
let lastRefreshFailureAt = 0; // ms epoch
let isLoggingOut = false; // Flag to prevent requests during logout/redirect

function processQueue(error: any | null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  pendingQueue = [];
}

// Simplified cookie management for HTTP-only only approach
import { clearNonHttpOnlyCookies } from "./cookieManager";

// Expose globally for debugging and coordination
if (typeof window !== "undefined") {
  (window as any).__clearNonHttpOnlyCookies = clearNonHttpOnlyCookies;
  (window as any).__isLoggingOut = false; // Shared flag across all modules
  console.log(
    "[Auth] Debug: window.__clearNonHttpOnlyCookies() available for manual cleanup"
  );
}

async function refreshTokens(): Promise<void> {
  const refreshTrace = `rf_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  console.log("[Auth] 🔄 Starting refresh attempt", { trace: refreshTrace });
  // Basic cooldown to avoid spam on repeated 401s
  const now = Date.now();
  if (now - lastRefreshFailureAt < 3000) {
    console.warn("[Auth] Skipping refresh due to recent failure cooldown");
    throw new Error("Refresh cooldown");
  }
  if (isRefreshing) {
    return new Promise<void>((resolve, reject) => {
      pendingQueue.push({ resolve, reject });
    });
  }
  isRefreshing = true;
  console.log("[Auth] 🔄 Attempting to refresh HTTP-only tokens...");

  try {
    // Proactively ensure we have a CSRF token before hitting refresh endpoint
    await ensureCsrfToken(http);
    // Call same-origin Next API which proxies to backend and forwards cookies/CSRF
    const csrf = getCookie("XSRF-TOKEN") || lastCsrfToken;
    const resp = await fetch(apiPath("/auth/refresh"), {
      method: "POST",
      credentials: "include", // Critical: Include HTTP-only cookies
      headers: {
        "Content-Type": "application/json",
        ...(csrf ? { "X-CSRF-Token": String(csrf) } : {}),
        "X-Debug-Source": "httpClient.refresh",
        "X-Debug-Trace": refreshTrace,
        "X-Debug-Ts": String(Date.now()),
      },
      body: JSON.stringify({}), // Backend will use cookies, no body token needed
    });

    console.log(`[Auth] Refresh response status: ${resp.status}`);

    if (!resp.ok) {
      // If CSRF failed, try once more after forcing token fetch
      if (resp.status === 403) {
        console.log("[Auth] CSRF error, retrying with new token...");
        await ensureCsrfToken(http);
        const csrf2 = getCookie("XSRF-TOKEN") || lastCsrfToken;
        const retry = await fetch(apiPath("/auth/refresh"), {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(csrf2 ? { "X-CSRF-Token": String(csrf2) } : {}),
            "X-Debug-Source": "httpClient.refresh.retry",
            "X-Debug-Trace": refreshTrace,
            "X-Debug-Ts": String(Date.now()),
          },
          body: JSON.stringify({}),
        });
        console.log(`[Auth] Retry response status: ${retry.status}`);
        if (!retry.ok) {
          // Refresh failed - call logout to clear HTTP-only cookies and redirect
          await handleRefreshFailure(retry.status);
          throw new Error(`Refresh failed: ${retry.status}`);
        }
      } else {
        // Refresh failed - call logout to clear HTTP-only cookies and redirect
        await handleRefreshFailure(resp.status);
        throw new Error(`Refresh failed: ${resp.status}`);
      }
    }

    console.log("[Auth] ✅ HTTP-only token refresh successful");
    processQueue(null);
  } catch (err) {
    // Clear non-HTTP-only cookies and CSRF cache on any refresh failure
    console.log("[Auth] ❌ Refresh error caught:", err);
    clearNonHttpOnlyCookies();
    csrfManager.clearCache();
    lastRefreshFailureAt = Date.now();
    processQueue(err);
    throw err;
  } finally {
    isRefreshing = false;
  }
}

/**
 * Handle refresh token failure by calling logout API and redirecting to login
 */
async function handleRefreshFailure(status: number): Promise<void> {
  // Prevent multiple simultaneous logout attempts
  if (isLoggingOut) {
    console.log("[Auth] Already logging out, skipping duplicate logout");
    throw new Error("Already logging out");
  }

  isLoggingOut = true;
  if (typeof window !== "undefined") {
    (window as any).__isLoggingOut = true;
  }
  console.log(
    `[Auth] ❌ Refresh failed with status ${status} - logging out and redirecting`
  );

  // Clear non-HTTP-only cookies and CSRF cache
  clearNonHttpOnlyCookies();
  csrfManager.clearCache();

  // Call backend logout to clear HTTP-only cookies (only once)
  try {
    await fetch(apiPath("/auth/logout"), {
      method: "POST",
      credentials: "include",
      headers: {
        "X-Skip-Auth-Refresh": "true", // Prevent this request from triggering refresh
      },
    });
    console.log("[Auth] Backend logout successful");
  } catch (logoutError) {
    console.warn(
      "[Auth] Backend logout failed (continuing anyway):",
      logoutError
    );
  }

  // Redirect to login page immediately
  if (typeof window !== "undefined") {
    console.log("[Auth] 🚪 Redirecting to login - session invalidated");
    
    // Immediate redirect - don't wait
    window.location.href =
      "/login?reason=session_expired&message=" +
      encodeURIComponent("Your session has expired. Please log in again.");
  }
}

http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & {
      _retry?: boolean;
      _skipAuthRefresh?: boolean;
    };
    const status = error.response?.status;
    const data = error.response?.data as any;

    // Precompute logout/refresh detection
    const isLogoutOrRefresh =
      original.url?.includes("/auth/logout") ||
      original.url?.includes("/auth/refresh") ||
      original.headers?.["X-Skip-Auth-Refresh"] === "true";

    // CSRF first: handle EBADCSRFTOKEN before other 403 handling
    if (
      status === 403 &&
      (error.response?.data as any)?.error?.code === "EBADCSRFTOKEN" &&
      !original._retry &&
      !isLogoutOrRefresh
    ) {
      original._retry = true;
      try {
        await ensureCsrfToken(http);
        return http.request(original);
      } catch (e) {
        return Promise.reject(e);
      }
    }

    // If we're in the process of logging out, reject all requests immediately
    if (isLoggingOut) {
      console.log("[Auth] Request blocked - logout in progress");
      return Promise.reject(new Error("Logout in progress"));
    }

    // Handle IP blocking - redirect to dedicated page
    // Log 403 errors for debugging
    if (status === 403) {
      const dbgError = (data && typeof data === 'object' && 'data' in (data as any)) ? ((data as any).data?.error ?? (data as any).error) : (data as any)?.error;
      const dbgCode = (data && typeof data === 'object' && 'data' in (data as any)) ? ((data as any).data?.code ?? (data as any).code) : (data as any)?.code;
      console.log('[httpClient] 403 error detected:', {
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
    const body: any = (data && typeof data === 'object' && 'data' in data && typeof (data as any).data === 'object') ? (data as any).data : data;

    const resIp = status === 403 ? detectIpBlock(body) : { ipBlocked: false as const };
    if (resIp.ipBlocked) {
      console.log('[httpClient] IP blocked detected');

      if (typeof window !== 'undefined') {
        if (window.location.pathname.includes('/ip-blocked')) {
          console.log('[httpClient] Already on IP blocked page, not redirecting');
          return Promise.reject(error);
        }
        if ((window as any).__redirectingToIPBlocked) {
          console.log('[httpClient] Already redirecting to IP blocked page, skipping');
          return Promise.reject(error);
        }
        (window as any).__redirectingToIPBlocked = true;

        const params = new URLSearchParams(resIp.params!);
        console.log('[httpClient] Redirecting to /ip-blocked with params:', params.toString());
        setTimeout(() => {
          window.location.href = `/ip-blocked?${params.toString()}`;
        }, 100);
      }
      return Promise.reject(error);
    }

    // Skip auth refresh for logout and refresh endpoints, or if header says to skip
    // using isLogoutOrRefresh computed above

    // CSRF error handling: if 403 with EBADCSRFTOKEN, fetch new token then retry once
    if (
      status === 403 &&
      (error.response?.data as any)?.error?.code === "EBADCSRFTOKEN" &&
      !original._retry &&
      !isLogoutOrRefresh
    ) {
      original._retry = true;
      try {
        await ensureCsrfToken(http);
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
      console.log("[Auth] 401 from:", original.url, "src:", (original.headers as any)?.['X-Debug-Source']);
      original._retry = true;
      console.log("[Auth] Received 401, attempting HTTP-only refresh...", { url: original.url, src: (original.headers as any)?.['X-Debug-Source'] });
      try {
        await refreshTokens();
        console.log(
          "[Auth] HTTP-only refresh succeeded, retrying original request",
          { url: original.url, src: (original.headers as any)?.['X-Debug-Source'] }
        );
        return http.request(original);
      } catch (refreshError) {
        // Refresh failed - non-HTTP-only cookies should already be cleared by refreshTokens()
        console.log(
          "[Auth] HTTP-only refresh failed, non-HTTP-only cookies cleared",
          { url: original.url, src: (original.headers as any)?.['X-Debug-Source'] }
        );
        // Avoid retry storms: set failure time
        lastRefreshFailureAt = Date.now();
        return Promise.reject(refreshError);
      }
    }

    // If this is a 401 and we already tried refresh (_retry = true), session is truly invalid - logout and redirect
    if (status === 401 && original._retry && !isLogoutOrRefresh) {
      console.log(
        "[Auth] Received 401 after retry attempt - session invalidated, logging out"
      );
      // Call handleRefreshFailure to properly logout and redirect
      await handleRefreshFailure(status);
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
