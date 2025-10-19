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
import { config } from "./config";

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

// ✅ IMPROVED: Simplified CSRF token management with single-flight pattern
let csrfToken: string | null = null;
let csrfFetchPromise: Promise<string> | null = null;

async function getCsrfToken(): Promise<string> {
  // Return cached token if available
  if (csrfToken) return csrfToken;

  // If fetch in progress, wait for it
  if (csrfFetchPromise) return csrfFetchPromise;

  // Fetch new token
  csrfFetchPromise = (async () => {
    try {
      const resp = await fetch(apiPath("/csrf-token"), {
        credentials: "include",
        cache: "no-store",
      });
      const data = await resp.json();
      csrfToken = data.token;
      return csrfToken!;
    } finally {
      csrfFetchPromise = null;
    }
  })();

  return csrfFetchPromise;
}

// Clear CSRF cache on logout
export function clearCsrfCache() {
  csrfToken = null;
  csrfFetchPromise = null;
}

// Public helper to proactively fetch CSRF token
export async function prefetchCsrf(): Promise<void> {
  await getCsrfToken();
}

// Force-fetch a fresh CSRF token (useful before critical POSTs like login/refresh)
export async function refreshCsrf(): Promise<void> {
  clearCsrfCache();
  await getCsrfToken();
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

// Simplified cookie management for HTTP-only only approach
import { clearNonHttpOnlyCookies } from "./cookieManager";
import { clearAuthCacheOnFail } from "./auth";

// Expose globally for debugging and coordination
if (typeof window !== "undefined") {
  (window as any).__clearNonHttpOnlyCookies = clearNonHttpOnlyCookies;
  (window as any).__isLoggingOut = false; // Shared flag across all modules
  console.log(
    "[Auth] Debug: window.__clearNonHttpOnlyCookies() available for manual cleanup",
  );
}

// ✅ IMPROVED: Simplified token refresh with single-flight pattern
async function refreshTokens(): Promise<void> {
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

      // Handle refresh failure (logout and redirect)
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
    `[Auth] ❌ Refresh failed with status ${status} - logging out and redirecting`,
  );

  // Clear non-HTTP-only cookies and CSRF cache
  clearNonHttpOnlyCookies();
  clearCsrfCache();

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
      logoutError,
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

    // ✅ IMPROVED: Simplified CSRF error handling
    if (
      status === 403 &&
      (error.response?.data as any)?.error?.code === "EBADCSRFTOKEN" &&
      !original._retry &&
      !isLogoutOrRefresh
    ) {
      original._retry = true;
      try {
        // Clear cache and get fresh token
        clearCsrfCache();
        await getCsrfToken();
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
      const dbgError =
        data && typeof data === "object" && "data" in (data as any)
          ? ((data as any).data?.error ?? (data as any).error)
          : (data as any)?.error;
      const dbgCode =
        data && typeof data === "object" && "data" in (data as any)
          ? ((data as any).data?.code ?? (data as any).code)
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
        // Avoid retry storms: set failure time
        lastRefreshFailureAt = Date.now();
        return Promise.reject(refreshError);
      }
    }

    // If this is a 401 and we already tried refresh (_retry = true), session is truly invalid - logout and redirect
    if (status === 401 && original._retry && !isLogoutOrRefresh) {
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
backendHttp.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Block all requests if we're logging out (except logout itself)
    if (isLoggingOut && !config.url?.includes("/auth/logout")) {
      console.log(
        "[BackendHttp] Request blocked - logout in progress:",
        config.url,
      );
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
  },
);

// Response interceptor for backend HTTP client (similar to main http client)
backendHttp.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & {
      _retry?: boolean;
      _skipAuthRefresh?: boolean;
    };
    const status = error.response?.status;
    const data = error.response?.data as any;

    const isLogoutOrRefresh =
      original.url?.includes("/auth/logout") ||
      original.url?.includes("/auth/refresh") ||
      original.headers?.["X-Skip-Auth-Refresh"] === "true";

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
        lastRefreshFailureAt = Date.now();
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
