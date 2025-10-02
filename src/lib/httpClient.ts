import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { BACKEND_BASE_URL, backendPath } from "./backend";
import { apiPath } from "./base-path";

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

// Request interceptor: attach CSRF header if available and set Content-Type
http.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const method = (config.method || "get").toLowerCase();

  // Set Content-Type to application/json for non-FormData requests
  if (["post", "put", "patch", "delete"].includes(method)) {
    const h = (config.headers ||= {} as any);

    // Only set Content-Type if it's not FormData (let browser set multipart/form-data)
    if (!(config.data instanceof FormData) && !h["Content-Type"]) {
      h["Content-Type"] = "application/json";
    }

    // Attach CSRF token for state-changing methods
    let csrf = getCookie("XSRF-TOKEN") || lastCsrfToken;
    if (!csrf) {
      await ensureCsrfToken(http);
      csrf = getCookie("XSRF-TOKEN") || lastCsrfToken;
    }
    if (csrf) {
      h["X-CSRF-Token"] = csrf;
    }
  }
  return config;
});

// Response interceptor: handle 401 by attempting refresh, then retry once
let isRefreshing = false;
let pendingQueue: Array<{ resolve: () => void; reject: (e: any) => void }> = [];
let lastRefreshFailureAt = 0; // ms epoch

function processQueue(error: any | null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  pendingQueue = [];
}

// Helper to clear auth cookies when session is invalid
function clearAuthCookies(): void {
  if (typeof document === "undefined") {
    console.log('[Auth] Cannot clear cookies - document is undefined (SSR)');
    return;
  }
  
  console.log('[Auth] ⚠️ CLEARING AUTH COOKIES - Session invalidated');
  console.log('[Auth] Cookies before clear:', document.cookie);
  
  const cookiesToClear = [
    "accessToken",
    "refreshToken",
    "access_token",
    "refresh_token",
    "authToken",
    "auth_token",
    "token",
    "socket_token" // SECURITY FIX: Removed socketToken
  ];
  
  // Get all possible domain variations
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  const domains = [
    '', // No domain (current domain only)
    hostname,
    `.${hostname}`,
  ];
  
  // If hostname has multiple parts (e.g., app.example.com), also try base domain
  if (parts.length > 2) {
    const baseDomain = parts.slice(-2).join('.');
    domains.push(baseDomain);
    domains.push(`.${baseDomain}`);
  }
  
  // Clear each cookie with all domain/path combinations
  cookiesToClear.forEach(name => {
    domains.forEach(domain => {
      const domainStr = domain ? `domain=${domain};` : '';
      // Try multiple path combinations
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; ${domainStr}`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/api; ${domainStr}`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; ${domainStr}`;
      // Also set to empty string as additional measure
      document.cookie = `${name}=; path=/; ${domainStr} max-age=0;`;
    });
    console.log(`[Auth] Cleared cookie: ${name}`);
  });
  
  console.log('[Auth] ✅ All auth cookies cleared');
  console.log('[Auth] Cookies after clear:', document.cookie);
}

// Expose globally for debugging
if (typeof window !== 'undefined') {
  (window as any).__clearAuthCookies = clearAuthCookies;
  console.log('[Auth] Debug: window.__clearAuthCookies() available for manual cookie cleanup');
}

async function refreshTokens(): Promise<void> {
  // Basic cooldown to avoid spam on repeated 401s
  const now = Date.now();
  if (now - lastRefreshFailureAt < 3000) {
    console.warn('[Auth] Skipping refresh due to recent failure cooldown');
    throw new Error('Refresh cooldown');
  }
  if (isRefreshing) {
    return new Promise<void>((resolve, reject) => {
      pendingQueue.push({ resolve, reject });
    });
  }
  isRefreshing = true;
  console.log('[Auth] 🔄 Attempting to refresh tokens...');
  
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
    
    console.log(`[Auth] Refresh response status: ${resp.status}`);
    
    if (!resp.ok) {
      // If CSRF failed, try once more after forcing token fetch
      if (resp.status === 403) {
        console.log('[Auth] CSRF error, retrying with new token...');
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
        console.log(`[Auth] Retry response status: ${retry.status}`);
        if (!retry.ok) {
          // Refresh failed - clear cookies locally
          console.log('[Auth] ❌ Refresh retry failed, clearing cookies');
          clearAuthCookies();
          throw new Error(`Refresh failed: ${retry.status}`);
        }
      } else {
        // Refresh failed - clear cookies locally
        console.log(`[Auth] ❌ Refresh failed with status ${resp.status}, clearing cookies`);
        clearAuthCookies();
        throw new Error(`Refresh failed: ${resp.status}`);
      }
    }
    
    console.log('[Auth] ✅ Token refresh successful');
    processQueue(null);
  } catch (err) {
    // Clear cookies on any refresh failure
    console.log('[Auth] ❌ Refresh error caught, clearing cookies:', err);
    clearAuthCookies();
    lastRefreshFailureAt = Date.now();
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
      console.log('[Auth] Received 401, attempting refresh...');
      try {
        await refreshTokens();
        console.log('[Auth] Refresh succeeded, retrying original request');
        return http.request(original);
      } catch (refreshError) {
        // Refresh failed - cookies should already be cleared by refreshTokens()
        console.log('[Auth] Refresh failed, cookies should be cleared');
        // Double-check cookies are cleared
        if (typeof window !== 'undefined' && document.cookie.includes('Token')) {
          console.warn('[Auth] WARNING: Cookies still present after refresh failure, clearing now...');
          clearAuthCookies();
        }
        // Avoid retry storms: set failure time
        lastRefreshFailureAt = Date.now();
        return Promise.reject(refreshError);
      }
    }

    // If this is a 401 and we already tried refresh (_retry = true), clear cookies
    if (status === 401 && original._retry) {
      console.log('[Auth] Received 401 after retry attempt, clearing cookies');
      clearAuthCookies();
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
