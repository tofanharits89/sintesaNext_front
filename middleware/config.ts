/**
 * Middleware Configuration
 * Centralized configuration for authentication middleware
 */

export const MiddlewareConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  debugAuth: process.env.NEXT_PUBLIC_DEBUG_AUTH === "1",
  enableCacheInvalidation: process.env.ENABLE_CACHE_INVALIDATION === "1" || process.env.NODE_ENV === "production",
  cacheInvalidateSecret: process.env.CACHE_INVALIDATE_SECRET || "",
  probeMode: process.env.NEXT_MW_PROBE === "1",
  
  // Security-optimized TTL configuration
  sessionVerifyTtl: 15_000, // 15s - reduced for enhanced security
  maxCacheAge: 10_000, // 10s - maximum age for positive auth results
  healthCheckTtl: 300_000, // 5 minutes
  
  // Rate limiting
  rateLimitWindow: 60_000, // 1 minute
  rateLimitMaxRequests: 20, // burst limit per minute
  
  // Circuit breaker
  circuitBreakerFailureThreshold: 3,
  circuitBreakerTimeout: 60_000, // 1 minute
  
  // Retry configuration
  freshCookieThreshold: 2_000, // 2 seconds
  refreshWindowThreshold: 30_000, // 30 seconds
  freshCookieRetryDelay: 150, // ms
  refreshWindowRetryDelay: 300, // ms
  additionalRetryDelay: 500, // ms
  
  // Cache bypass
  bypassDuration: 30_000, // 30 seconds
} as const;

export const PathConfig = {
  public: ["/login"],
  static: ["/_next", "/favicon.ico", "/api/public", "/images", "/icons", "/server-error"],
  api: "/api/",
  serverError: "/server-error",
  dashboard: "/dashboard/utama",
} as const;

export const CookieNames = {
  accessToken: "accessToken",
  refreshToken: "refreshToken",
  xsrfToken: "XSRF-TOKEN",
  csrfToken: "csrfToken",
} as const;
