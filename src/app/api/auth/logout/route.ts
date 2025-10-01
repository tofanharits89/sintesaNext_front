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

  // ENTERPRISE BEST PRACTICE: Properly clear cookies with expires in the past
  // Next.js 15 requires explicit expires date, not just maxAge: 0
  const isProduction = process.env.NODE_ENV === "production";
  const pastDate = new Date(0); // Jan 1, 1970
  
  const clearOpts = { 
    path: "/", 
    expires: pastDate,
    maxAge: 0
  };
  
  const clearHttpOnly = { 
    ...clearOpts, 
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? "strict" : "lax") as "strict" | "lax"
  };

  // HttpOnly cookies set by backend - clear with production attributes
  res.cookies.set("accessToken", "", clearHttpOnly);
  res.cookies.set("refreshToken", "", clearHttpOnly);
  // Legacy names
  res.cookies.set("access_token", "", clearHttpOnly);
  res.cookies.set("refresh_token", "", clearHttpOnly);
  res.cookies.set("authToken", "", clearHttpOnly);
  res.cookies.set("auth_token", "", clearHttpOnly);

  // Best-effort clearing of legacy non-httpOnly names
  res.cookies.set("token", "", clearOpts);
  res.cookies.set("socket_token", "", clearOpts);
  res.cookies.set("authState", "", clearOpts);
  res.cookies.set("auth_user", "", clearOpts);

  // ENTERPRISE BEST PRACTICE: Clear with all possible domain/attribute combinations
  // This handles cookies set with different domain attributes
  const host = req.nextUrl.hostname;
  const parts = host.split('.');
  const baseDomain = parts.length >= 2 ? parts.slice(-2).join('.') : host;
  const cookieDomain = process.env.COOKIE_DOMAIN;
  
  const domains = new Set<string>();
  if (cookieDomain) domains.add(cookieDomain);
  domains.add(baseDomain);
  domains.add('.' + baseDomain);
  if (host !== baseDomain) domains.add(host);
  
  // Clear with each domain variant and both sameSite values
  for (const d of domains) {
    const domainClearHttpOnly = { 
      ...clearHttpOnly, 
      domain: d 
    };
    const domainClearOpts = { 
      ...clearOpts, 
      domain: d 
    };
    
    // Clear with strict sameSite
    res.cookies.set("accessToken", "", domainClearHttpOnly);
    res.cookies.set("refreshToken", "", domainClearHttpOnly);
    res.cookies.set("access_token", "", domainClearHttpOnly);
    res.cookies.set("refresh_token", "", domainClearHttpOnly);
    res.cookies.set("authToken", "", domainClearHttpOnly);
    res.cookies.set("auth_token", "", domainClearHttpOnly);
    
    // Clear with lax sameSite (in case cookies were set with lax)
    const laxClear = { ...domainClearHttpOnly, sameSite: "lax" as const };
    res.cookies.set("accessToken", "", laxClear);
    res.cookies.set("refreshToken", "", laxClear);
    
    // Non-httpOnly mirrors
    res.cookies.set("token", "", domainClearOpts);
    res.cookies.set("socket_token", "", domainClearOpts);
    res.cookies.set("authState", "", domainClearOpts);
    res.cookies.set("auth_user", "", domainClearOpts);
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
    
    // Generate signature if secret is configured
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-internal-request': 'true'
    };
    
    const secret = process.env.CACHE_INVALIDATE_SECRET;
    if (secret) {
      const encoder = new TextEncoder();
      const data = encoder.encode(`${secret}:${bodyData}`);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      headers['x-internal-signature'] = signature;
    }
    
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
