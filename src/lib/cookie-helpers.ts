/**
 * Cookie forwarding helpers for Next API routes
 *
 * Ensures consistent passthrough of multiple Set-Cookie headers from backend responses
 * to NextResponse, working across different runtimes/adapters.
 */
import { NextResponse } from "next/server";

/**
 * Extract all Set-Cookie values from a Fetch Response in a robust way.
 * - Prefer non-standard headers.getSetCookie() when available (Node/Next adapters).
 * - Fallback to single "set-cookie" header if present.
 * - Final fallback: iterate headers to find multiple "set-cookie" occurrences.
 */
export function getSetCookieValues(resp: Response): string[] {
  type HeadersWithGetSetCookie = Headers & { getSetCookie?: () => string[] };
  const headersAny = resp.headers as HeadersWithGetSetCookie;

  // Preferred: use getSetCookie() if provided by the runtime
  if (typeof headersAny?.getSetCookie === "function") {
    try {
      const cookies: string[] = headersAny.getSetCookie();
      if (Array.isArray(cookies) && cookies.length > 0) {
        return cookies;
      }
    } catch {
      // ignore and fallback
    }
  }

  // Next best: try direct "set-cookie" header
  const single = resp.headers.get("set-cookie");
  if (single) {
    // Note: cannot safely split by comma due to commas in Expires attributes.
    // Return as-is; append() multiple times will preserve multiple headers when available.
    return [single];
  }

  // Last resort: iterate headers and collect all entries named "set-cookie"
  const values: string[] = [];
  try {
    // Some implementations support forEach on headers
    resp.headers.forEach?.((value: string, key: string) => {
      if (typeof key === "string" && key.toLowerCase() === "set-cookie") {
        values.push(value);
      }
    });
  } catch {
    // ignore
  }

  return values;
}

/**
 * Forward all backend Set-Cookie values into the NextResponse headers.
 */
export function forwardSetCookies(resp: Response, nextRes: NextResponse): void {
  const cookies = getSetCookieValues(resp);
  for (const c of cookies) {
    nextRes.headers.append("set-cookie", c);
  }
}

/**
 * Convenience to mark responses as non-cacheable.
 */
export function applyNoStore(res: NextResponse): void {
  res.headers.set("Cache-Control", "no-store");
}
