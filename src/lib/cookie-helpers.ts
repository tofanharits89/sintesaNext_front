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
        console.log(
          "[Cookie Helper] Using getSetCookie(), found",
          cookies.length,
          "cookies"
        );
        return cookies;
      }
    } catch (e) {
      console.warn("[Cookie Helper] getSetCookie() failed:", e);
    }
  }

  // Try to get all set-cookie headers using raw headers
  // In Node.js fetch, multiple Set-Cookie headers are available via headers.raw()
  try {
    const rawHeaders = (resp.headers as any).raw?.();
    if (rawHeaders && rawHeaders["set-cookie"]) {
      const cookies = rawHeaders["set-cookie"];
      if (Array.isArray(cookies) && cookies.length > 0) {
        console.log(
          "[Cookie Helper] Using headers.raw(), found",
          cookies.length,
          "cookies"
        );
        return cookies;
      }
    }
  } catch (e) {
    console.warn("[Cookie Helper] headers.raw() failed:", e);
  }

  // Next best: try direct "set-cookie" header
  const single = resp.headers.get("set-cookie");
  if (single) {
    console.log(
      "[Cookie Helper] Using headers.get(), found single value:",
      single.substring(0, 100)
    );
    // If it contains multiple cookies (comma-separated), try to split them
    // This is risky because Expires attributes also contain commas
    // But we can detect multiple cookies by looking for multiple "=" signs followed by ";"
    const cookiePattern =
      /([^,]+?=.+?);(?:\s*(?:Max-Age|Path|Expires|HttpOnly|Secure|SameSite)=[^,]*)*(?:,\s*|$)/g;
    const matches = single.match(cookiePattern);
    if (matches && matches.length > 1) {
      console.log("[Cookie Helper] Split into", matches.length, "cookies");
      return matches.map((m) => m.trim().replace(/,$/, ""));
    }
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
    if (values.length > 0) {
      console.log(
        "[Cookie Helper] Using forEach(), found",
        values.length,
        "cookies"
      );
    }
  } catch (e) {
    console.warn("[Cookie Helper] forEach() failed:", e);
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
