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
  });
  const body = await resp.json().catch(() => ({ ok: resp.ok }));

  const res = NextResponse.json(body, { status: resp.ok ? 200 : resp.status });

  // Forward backend Set-Cookie clears; also clear legacy client cookies
  forwardSetCookies(resp, res);

  // SIMPLIFIED APPROACH: Use centralized cookie clearing logic
  // This eliminates the complex nested loops and improves reliability
  const isProduction = process.env.NODE_ENV === "production";
  const pastDate = new Date(0); // Jan 1, 1970

  const clearHttpOnly = {
    path: "/",
    expires: pastDate,
    maxAge: 0,
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? "strict" : "lax") as "strict" | "lax"
  };

  const clearNonHttpOnly = {
    ...clearHttpOnly,
    httpOnly: false
  };

  // Clear essential HttpOnly cookies (set by backend)
  res.cookies.set("accessToken", "", clearHttpOnly);
  res.cookies.set("refreshToken", "", clearHttpOnly);

  // Clear non-httpOnly cookies
  res.cookies.set("authState", "", clearNonHttpOnly);
  res.cookies.set("auth_user", "", clearNonHttpOnly);

  // SIMPLIFIED: Clear essential legacy cookies with single variant
  // This eliminates complex nested loops and reduces failure points
  const legacyCookies = [
    "token",
    "socket_token",
    "XSRF-TOKEN"
  ];

  for (const cookieName of legacyCookies) {
    res.cookies.set(cookieName, "", clearNonHttpOnly);
  }

  // Optional: Clear a few path variants for problematic cookies (reduced from 25+ to 3)
  const criticalPaths = ["/", "/api"]; // Most common paths
  for (const path of criticalPaths) {
    const pathOption = { ...clearHttpOnly, path };
    res.cookies.set("accessToken", "", pathOption);
    res.cookies.set("refreshToken", "", pathOption);
  }

  // Invalidate Next middleware auth cache immediately
  try {
    // Extract access token from cookies to invalidate specific session
    const accessToken = extractCookie(incomingCookie, "accessToken");
    const sessionKey = accessToken || incomingCookie || '*';
    
    // Build absolute URL for cache invalidation
    const protocol = req.nextUrl.protocol;
    const host = req.headers.get('host') || req.nextUrl.host;
    const invalidateUrl = `${protocol}//${host}/api/auth/invalidate-cache`;
    
    const bodyData = JSON.stringify({ 
      type: 'logout', 
      sessionKey: sessionKey,
      userId: (req as any).user?.id // Pass user ID if available
    });
    
    // SECURITY FIX: Use centralized signature generation
    const { prepareCacheInvalidationHeaders } = await import("@/utils/cache-signature");
    const headers = await prepareCacheInvalidationHeaders(bodyData);
    
    await fetch(invalidateUrl, {
      method: 'POST',
      headers,
      cache: 'no-store',
      body: bodyData
    });
  } catch (err) {
    // Silently fail - cache will expire naturally
    console.error('[Logout] Cache invalidation failed:', err);
  }

  return res;
}
