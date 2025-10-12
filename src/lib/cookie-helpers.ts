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
  if (typeof anyHeaders?.getSetCookie === 'function') {
    try {
      const arr: string[] = anyHeaders.getSetCookie();
      if (Array.isArray(arr)) return arr;
    } catch {}
  }

  // Fallback: pass through backend's raw Set-Cookie header unmodified.
  // Many runtimes do not aggregate multiple Set-Cookie values; get() may contain exactly
  // what the backend sent (single or already-comma-joined). Returning it as a single
  // entry lets callers set it verbatim (using headers.set) without risking mis-splits.
  const raw = response.headers.get('set-cookie');
  if (!raw) return [];
  return [raw];
}

/**
 * Forward Set-Cookie headers from backend response to Next.js response
 */
function adjustCookieForDev(cookieValue: string): string {
  try {
    if (process.env.NODE_ENV === 'production') return cookieValue;
    // Only adjust auth cookies in dev to ensure they stick on http://localhost
    const isAuthCookie = /^(access_token|refresh_token)=/i.test(cookieValue);
    if (!isAuthCookie) return cookieValue;

    let adjusted = cookieValue;
    // Replace SameSite=None with SameSite=Lax (dev-friendly)
    adjusted = adjusted.replace(/;\s*SameSite=None\b/i, '; SameSite=Lax');
    // Remove stray Secure if present (rare in your backend dev cookies)
    adjusted = adjusted.replace(/;\s*Secure\b/gi, '');
    return adjusted;
  } catch {
    return cookieValue;
  }
}

export function forwardSetCookies(
  backendResponse: Response,
  nextResponse: NextResponse
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
    nextResponse.headers.set("set-cookie", setCookieValues[0]);
  }

  return nextResponse;
}

/**
 * Get all cookies from request for forwarding to backend
 */
export function getRequestCookies(request: NextRequest): Record<string, string> {
  const cookies: Record<string, string> = {};

  request.cookies.getAll().forEach(cookie => {
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