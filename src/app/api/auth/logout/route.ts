import { NextResponse, NextRequest } from "next/server";
import { backendPath } from "@/lib/backend";
import { forwardSetCookies } from "@/lib/cookie-helpers";

function extractCookie(cookiesHeader: string, name: string): string | null {
  if (!cookiesHeader) return null;
  const parts = cookiesHeader.split(";").map((c) => c.trim());
  const match = parts.find((c) => c.startsWith(`${encodeURIComponent(name)}=`));
  if (!match) return null;
  const value = match.split("=")[1] || "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function POST(req: NextRequest) {
  // Forward incoming cookies and CSRF to backend
  const incomingCookie = req.headers.get("cookie") ?? "";
  const xsrfFromCookie = extractCookie(incomingCookie, "XSRF-TOKEN");
  // Also honor any explicit CSRF headers from the client
  const incomingCsrfHeader =
    req.headers.get("x-csrf-token") || req.headers.get("x-xsrf-token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (incomingCookie) headers["cookie"] = incomingCookie;
  const csrf = incomingCsrfHeader || xsrfFromCookie;
  if (csrf) headers["X-CSRF-Token"] = String(csrf);
  // Forward Authorization header if present so backend can hash and deactivate that session
  const incomingAuth = req.headers.get("authorization");
  if (incomingAuth) headers["authorization"] = incomingAuth;

  // Call backend logout to invalidate session; forward any Set-Cookie clears
  const resp = await fetch(backendPath("/auth/logout"), {
    method: "POST",
    headers,
    cache: "no-store",
    // Add credentials to ensure cookies are sent and received properly
    credentials: "include",
  });
  const body = await resp.json().catch(() => ({ ok: resp.ok }));

  const res = NextResponse.json(body, { status: resp.ok ? 200 : resp.status });

  // CRITICAL: Forward ALL backend Set-Cookie headers first
  // The backend is responsible for clearing HttpOnly cookies
  forwardSetCookies(resp, res);

  console.log("[Logout Route] Forwarded Set-Cookie headers from backend");

  // Also manually append cookie clearing headers to ensure they're sent
  // This is a backup in case forwardSetCookies doesn't work
  const clearHeaders = [
    "accessToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax",
    "refreshToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax",
    "accessToken=; Domain=localhost; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax",
    "refreshToken=; Domain=localhost; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax",
    // More aggressive clearing for proxy scenarios
    "accessToken=; Domain=localhost:3000; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax",
    "refreshToken=; Domain=localhost:3000; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax",
    "accessToken=; Domain=localhost:88; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax",
    "refreshToken=; Domain=localhost:88; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax",
    // Non-HTTP-only variants that might exist
    "accessToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax",
    "refreshToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax",
    // Max-Age variants
    "accessToken=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax",
    "refreshToken=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax",
  ];

  clearHeaders.forEach((header) => {
    res.headers.append("set-cookie", header);
  });

  console.log("[Logout Route] Added manual Set-Cookie headers");

  // Invalidate Next middleware auth cache immediately
  try {
    // Extract access token from cookies to invalidate specific session
    const accessToken = extractCookie(incomingCookie, "accessToken");
    const sessionKey = accessToken || incomingCookie || "*";

    // Build absolute URL for cache invalidation
    const protocol = req.nextUrl.protocol;
    const host = req.headers.get("host") || req.nextUrl.host;
    const invalidateUrl = `${protocol}//${host}/api/auth/invalidate-cache`;

    const bodyData = JSON.stringify({
      type: "logout",
      sessionKey: sessionKey,
      userId: (req as any).user?.id, // Pass user ID if available
    });

    // SECURITY FIX: Use centralized signature generation
    const { prepareCacheInvalidationHeaders } = await import(
      "@/utils/cache-signature"
    );
    const headers = await prepareCacheInvalidationHeaders(bodyData);

    await fetch(invalidateUrl, {
      method: "POST",
      headers,
      cache: "no-store",
      body: bodyData,
    });
  } catch (err) {
    // Silently fail - cache will expire naturally
    console.error("[Logout] Cache invalidation failed:", err);
  }

  return res;
}
