/**
 * Cookie Filtering Utilities
 * SECURITY FIX: Uses allowlist-based filtering instead of denylist to prevent edge cases
 * Ensures only explicitly allowed cookies are forwarded to the backend
 */

import { logger } from "./logger";
import type { NextRequest } from "next/server";

/**
 * Cookie filtering configuration
 * Only cookies in this allowlist will be forwarded to the backend
 */
export const ALLOWED_COOKIES = [
  // CSRF-related cookies (required for authentication)
  "XSRF-TOKEN",
  "XSRF-TOKEN-SESSION",

  // Server-managed CSRF session identifier
  "csrf_sid",

  // Session cookies (for maintaining session state)
  // Note: Session cookies (sid) are forwarded via Cookie header as needed
  // They are set by backend in HTTP-only cookies
] as const;

export type AllowedCookieName = typeof ALLOWED_COOKIES[number];

/**
 * Filter cookies using allowlist approach
 * Only cookies explicitly in the allowlist will be included
 *
 * @param cookieHeader - Raw cookie header string
 * @returns Filtered cookie string with only allowed cookies
 */
export function filterCookiesAllowlist(cookieHeader: string): string {
  if (!cookieHeader || typeof cookieHeader !== "string") {
    return "";
  }

  const cookieParts = cookieHeader.split(";").map((c) => c.trim()).filter(Boolean);

  const allowedCookies: string[] = [];
  const rejectedCookies: string[] = [];

  for (const cookie of cookieParts) {
    const cookieName = cookie.split("=")[0];

    if (cookieName && ALLOWED_COOKIES.includes(cookieName as AllowedCookieName)) {
      allowedCookies.push(cookie);
    } else if (cookieName) {
      rejectedCookies.push(cookieName);
    }
  }

  // Log filtering results for debugging
  if (rejectedCookies.length > 0) {
    logger.debug("[Cookie Filter] Rejected cookies:", rejectedCookies);
  }

  if (allowedCookies.length > 0) {
    logger.debug("[Cookie Filter] Allowed cookies:", allowedCookies);
  }

  return allowedCookies.join("; ");
}

/**
 * Extract specific cookie value by name
 *
 * @param cookieHeader - Raw cookie header string
 * @param cookieName - Name of cookie to extract
 * @returns Cookie value or null if not found
 */
export function getCookieValue(cookieHeader: string, cookieName: string): string | null {
  if (!cookieHeader) {
    return null;
  }

  const cookieMatch = cookieHeader.match(new RegExp(`(?:^|;)\\s*${cookieName}=([^;]*)`));
  return cookieMatch?.[1] ? decodeURIComponent(cookieMatch[1]) : null;
}

/**
 * Check if cookie is in allowlist
 *
 * @param cookieName - Name of cookie to check
 * @returns True if cookie is allowed
 */
export function isCookieAllowed(cookieName: string): boolean {
  return ALLOWED_COOKIES.includes(cookieName as AllowedCookieName);
}

/**
 * Get all allowed cookie names
 *
 * @returns Array of allowed cookie names
 */
export function getAllowedCookieNames(): string[] {
  return [...ALLOWED_COOKIES];
}

/**
 * Parse cookie header into key-value map
 *
 * @param cookieHeader - Raw cookie header string
 * @returns Map of cookie names to values
 */
export function parseCookies(cookieHeader: string): Record<string, string> {
  if (!cookieHeader || typeof cookieHeader !== "string") {
    return {};
  }

  const cookies: Record<string, string> = {};
  const cookieParts = cookieHeader.split(";").map((c) => c.trim()).filter(Boolean);

  for (const cookie of cookieParts) {
    const [name, ...valueParts] = cookie.split("=");
    if (name && valueParts.length > 0) {
      cookies[name] = decodeURIComponent(valueParts.join("="));
    }
  }

  return cookies;
}

/**
 * Validate cookie filtering results
 *
 * @param originalCookieHeader - Original cookie header
 * @param filteredCookieHeader - Filtered cookie header
 * @returns Validation result with statistics
 */
export function validateCookieFiltering(
  originalCookieHeader: string,
  filteredCookieHeader: string
): {
  isValid: boolean;
  originalCount: number;
  filteredCount: number;
  rejectedCount: number;
  rejectedCookies: string[];
} {
  const originalCookies = parseCookies(originalCookieHeader);
  const filteredCookies = parseCookies(filteredCookieHeader);

  const originalCount = Object.keys(originalCookies).length;
  const filteredCount = Object.keys(filteredCookies).length;
  const rejectedCount = originalCount - filteredCount;

  const rejectedCookies = Object.keys(originalCookies).filter(
    (name) => !filteredCookies[name]
  );

  const isValid =
    rejectedCount >= 0 &&
    rejectedCookies.every((name) => !isCookieAllowed(name)) &&
    Object.keys(filteredCookies).every((name) => isCookieAllowed(name));

  return {
    isValid,
    originalCount,
    filteredCount,
    rejectedCount,
    rejectedCookies,
  };
}

/**
 * Safe cookie forwarding for API routes
 * Ensures only allowed cookies are forwarded to backend
 *
 * @param request - Next.js request object
 * @returns Filtered cookie header string
 */
export function getSafeCookies(request: NextRequest): string {
  const cookieHeader = request.headers.get("cookie") || "";
  const filteredCookies = filterCookiesAllowlist(cookieHeader);

  logger.debug("[Cookie Filter] Safe cookies prepared for backend request");
  logger.debug("[Cookie Filter] Original cookie count:", cookieHeader.split(";").filter((c: string) => c.trim()).length);
  logger.debug("[Cookie Filter] Filtered cookie count:", filteredCookies.split(";").filter((c: string) => c.trim()).length);

  return filteredCookies;
}

export default {
  ALLOWED_COOKIES,
  filterCookiesAllowlist,
  getCookieValue,
  isCookieAllowed,
  getAllowedCookieNames,
  parseCookies,
  validateCookieFiltering,
  getSafeCookies,
};
