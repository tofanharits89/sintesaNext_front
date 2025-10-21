/**
 * Unified Frontend Configuration
 *
 * Single source of truth for environment-based configuration
 * Eliminates scattered env var usage and complex fallback chains
 */

/**
 * Get API base URL based on environment
 * Priority: NEXT_PUBLIC_API_URL > localhost fallback
 */
function getApiUrl(): string {
  // Client-side: prefer same-origin relative path so cookies are set for the app origin
  if (typeof window !== "undefined") {
    // Allow opting out via env if needed
    if (process.env.NEXT_PUBLIC_USE_ABSOLUTE_API === "false") {
      return process.env.NEXT_PUBLIC_API_URL || "http://localhost:88/api/v1";
    }
    return "/api/v1";
  }

  // Server-side: use server env var (Docker internal) or public fallback
  return (
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:88/api/v1"
  );
}

/**
 * Get Socket.IO URL by removing /api/v1 suffix from API URL
 */
function getSocketUrl(): string {
  const apiUrl = getApiUrl();
  // If API URL is absolute, socket URL is its origin
  if (/^https?:\/\//i.test(apiUrl)) {
    return apiUrl.replace(/\/api\/v1$/, "");
  }

  // API is relative (e.g. '/api/v1'). Build backend origin for sockets.
  // Priority: explicit env → derive from window → sane fallback
  const envOrigin =
    (typeof process !== 'undefined' && (
      process.env.NEXT_PUBLIC_SOCKET_ORIGIN || process.env.NEXT_PUBLIC_BACKEND_ORIGIN
    )) || undefined;
  if (envOrigin) return envOrigin;

  if (typeof window !== 'undefined') {
    try {
      const { protocol, hostname } = window.location;
      const backendPort = (process.env.NEXT_PUBLIC_BACKEND_PORT || '88').trim();
      return `${protocol}//${hostname}:${backendPort}`;
    } catch {
      // ignore and fall through
    }
  }
  // Server-side fallback (dev docker default)
  return 'http://localhost:88';
}

/**
 * Unified configuration object
 */
export const config = {
  /** API base URL (includes /api/v1) */
  apiUrl: getApiUrl(),

  /** Socket.IO URL (without /api/v1) */
  socketUrl: getSocketUrl(),

  /** Socket.IO path */
  socketPath: process.env.NEXT_PUBLIC_SOCKET_PATH || "/socket.io",

  /** Environment */
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",

  /** Debug flags */
  debugAuth: process.env.NEXT_PUBLIC_DEBUG_AUTH === "true",
} as const;

/**
 * Helper to construct API paths
 * @param path - API path (with or without leading slash)
 * @returns Full API URL
 */
export function apiPath(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${config.apiUrl}${cleanPath}`;
}

/**
 * Helper to construct backend paths (for backward compatibility)
 * @param path - Backend path (with or without leading slash)
 * @returns Full backend URL
 */
export function backendPath(path: string): string {
  return apiPath(path);
}
