/**
 * Simple cookie utilities for API routes
 * Handles cookie forwarding between frontend and backend API routes
 */

import type { NextRequest, NextResponse } from "next/server";

/**
 * Extract Set-Cookie headers from backend response and forward to client
 */
export function getSetCookieValues(response: Response): string[] {
  // Prefer platform API if available (Node/undici/Next.js)
  const anyHeaders: any = response.headers as any;
  if (typeof anyHeaders?.getSetCookie === "function") {
    try {
      const arr: string[] = anyHeaders.getSetCookie();
      if (Array.isArray(arr)) return arr;
    } catch {}
  }

  // Fallback: pass through backend's raw Set-Cookie header unmodified.
  // Many runtimes do not aggregate multiple Set-Cookie values; get() may contain exactly
  // what the backend sent (single or already-comma-joined). Returning it as a single
  // entry lets callers set it verbatim (using headers.set) without risking mis-splits.
  const raw = response.headers.get("set-cookie");
  if (!raw) return [];
  return [raw];
}

/**
 * Forward Set-Cookie headers from backend response to Next.js response
 */
function adjustCookieForDev(cookieValue: string): string {
  try {
    if (process.env.NODE_ENV === "production") return cookieValue;
    // Allow opting into production-like cookie behavior during development
    if (process.env.NEXT_PUBLIC_COOKIE_DEV_SECURE === "true") return cookieValue;
    // Only adjust auth cookies in dev to ensure they stick on http://localhost
    const isAuthCookie = /^(access_token|refresh_token)=/i.test(cookieValue);
    if (!isAuthCookie) return cookieValue;

    let adjusted = cookieValue;
    // Replace SameSite=None with SameSite=Lax (dev-friendly)
    adjusted = adjusted.replace(/;\s*SameSite=None\b/i, "; SameSite=Lax");
    // Remove stray Secure if present (rare in your backend dev cookies)
    adjusted = adjusted.replace(/;\s*Secure\b/gi, "");
    return adjusted;
  } catch {
    return cookieValue;
  }
}

export function forwardSetCookies(
  backendResponse: Response,
  nextResponse: NextResponse,
): NextResponse {
  const rawValues = getSetCookieValues(backendResponse);
  const setCookieValues = rawValues.map(adjustCookieForDev);

  if (setCookieValues.length > 1) {
    // Multiple cookie values available – append each separately
    setCookieValues.forEach((cookieValue) => {
      nextResponse.headers.append("set-cookie", cookieValue);
    });
  } else if (setCookieValues.length === 1) {
    // Single raw Set-Cookie header from backend – set verbatim
    nextResponse.headers.set("set-cookie", setCookieValues[0]!);
  }

  return nextResponse;
}

/**
 * Get all cookies from request for forwarding to backend
 */
export function getRequestCookies(
  request: NextRequest,
): Record<string, string> {
  const cookies: Record<string, string> = {};

  request.cookies.getAll().forEach((cookie) => {
    if (cookie.name && cookie.value) {
      cookies[cookie.name] = cookie.value;
    }
  });

  return cookies;
}

/**
 * Create Cookie header for backend requests
 */
export function createCookieHeader(request: NextRequest): string {
  const cookies = getRequestCookies(request);
  return Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

/**
 * Sanitize cookie string for logging by replacing sensitive values with redacted text
 */
export function sanitizeCookieLog(cookieString: string | null): string {
  if (!cookieString) return "No cookies present";

  const sensitivePatterns = [
    /access_token=[^;]+/gi,
    /refresh_token=[^;]+/gi,
    /accessToken=[^;]+/gi,
    /refreshToken=[^;]+/gi,
    /auth_token=[^;]+/gi,
    /authToken=[^;]+/gi,
    /XSRF-TOKEN=[^;]+/gi,
    /_csrf=[^;]+/gi,
    /session=[^;]+/gi,
    /jwt=[^;]+/gi,
  ];

  let sanitized = cookieString;
  sensitivePatterns.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, (match) => {
      const name = match.split("=")[0];
      return `${name}=***REDACTED***`;
    });
  });

  return sanitized.length > 100
    ? sanitized.substring(0, 100) + "..."
    : sanitized;
}

/**
 * Extract metadata from cookie string for secure logging
 */
export function extractCookieMetadata(cookieString: string | null): {
  count: number;
  hasAuth: boolean;
  hasCsrf: boolean;
  hasSession: boolean;
} {
  if (!cookieString)
    return { count: 0, hasAuth: false, hasCsrf: false, hasSession: false };

  return {
    count: cookieString.split(";").filter((c) => c.trim()).length,
    hasAuth: /access_token|refresh_token|auth_token/i.test(cookieString),
    hasCsrf: /xsrf-token|_csrf/i.test(cookieString),
    hasSession: /session/i.test(cookieString),
  };
}
