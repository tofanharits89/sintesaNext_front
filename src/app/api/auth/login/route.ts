import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendPath } from "@/lib/backend";
import { forwardSetCookies, getSetCookieValues } from "@/lib/cookie-helpers";


export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { username, password, captcha, expectedCaptcha } = body as {
    username?: string;
    password?: string;
    captcha?: string;
    expectedCaptcha?: string;
  };

  // Call backend login API and forward Set-Cookie headers
  let cookie = request.headers.get("cookie") || "";
  let xsrf =
    request.cookies.get("XSRF-TOKEN")?.value ||
    request.cookies.get("_csrf")?.value;

  // If no XSRF token present, prime it by calling backend /csrf-token and reuse its cookies for login
  if (!xsrf) {
    const csrfResp = await fetch(backendPath("/csrf-token"), {
      method: "GET",
      headers: { ...(cookie ? { cookie } : {}) },
      credentials: "include",
      cache: "no-store",
    });

    // Extract all Set-Cookie values robustly and find XSRF-TOKEN
    const allSetCookies = getSetCookieValues(csrfResp);
    const xsrfCookie = allSetCookies.find((c) => c.startsWith("XSRF-TOKEN="));
    if (xsrfCookie) {
      const nameValue = xsrfCookie.split(";")[0] ?? ""; // XSRF-TOKEN=...
      const parts = nameValue.split("=");
      xsrf = parts.length > 1 ? parts[1] : xsrf;
      // Merge cookies for the subsequent login fetch
      const newCookies = allSetCookies
        .filter(Boolean)
        .map((c) => (c.split(";")[0] ?? ""))
        .filter(Boolean)
        .join("; ");
      cookie = [cookie, newCookies].filter(Boolean).join("; ");
    }
  }

  async function doLogin(currentCookie: string, currentXsrf?: string) {
    return fetch(backendPath("/auth/login"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(currentCookie ? { cookie: currentCookie } : {}),
        ...(currentXsrf ? { "X-CSRF-Token": currentXsrf } : {}),
      },
      body: JSON.stringify({ username, password, captcha, expectedCaptcha }),
      // CRITICAL FIX: Ensure cookies are sent and received
      credentials: "include",
    });
  }

  let resp = await doLogin(cookie, xsrf);

  // If CSRF failed with 403, force-refresh token and retry once
  if (resp.status === 403) {
    try {
      const csrfResp2 = await fetch(backendPath("/csrf-token"), {
        method: "GET",
        headers: { ...(cookie ? { cookie } : {}) },
        credentials: "include",
        cache: "no-store",
      });
      const allSetCookies2 = getSetCookieValues(csrfResp2);
      const xsrfCookie2 = allSetCookies2.find((c) => c.startsWith("XSRF-TOKEN="));
      if (xsrfCookie2) {
        const nameValue = xsrfCookie2.split(";")[0] ?? "";
        const parts = nameValue.split("=");
        xsrf = parts.length > 1 ? parts[1] : xsrf;
        const merged = allSetCookies2
          .filter(Boolean)
          .map((c) => (c.split(";")[0] ?? ""))
          .filter(Boolean)
          .join("; ");
        cookie = [cookie, merged].filter(Boolean).join("; ");
      }
      // retry once
      resp = await doLogin(cookie, xsrf);
    } catch {
      // ignore and let the original response handling proceed
    }
  }

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data?.success) {
    const errRes = NextResponse.json(
      { ok: false, error: data?.message || "Login failed" },
      { status: resp.status || 401 }
    );
    // Forward Set-Cookie headers from backend even on failure
    forwardSetCookies(resp, errRes);
    return errRes;
  }

  const user = data?.data?.user || null;
  const responseBody = {
    ok: true,
    success: true,
    username: user?.username || username,
    data: { user },
  };

  const res = NextResponse.json(responseBody, { status: 200 });
  
  // Debug: Log Set-Cookie headers from backend
  const setCookies = resp.headers.get('set-cookie');
  console.log('[Login Route] Backend Set-Cookie headers:', setCookies);
  console.log('[Login Route] All backend headers:', Array.from(resp.headers.entries()));
  
  // Forward all Set-Cookie headers to client via helper
  forwardSetCookies(resp, res);
  
  // Debug: Log forwarded headers
  console.log('[Login Route] Forwarded Set-Cookie to client:', res.headers.get('set-cookie'));

  // Clear middleware cache after successful login
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  
  // Clear middleware cache (fire-and-forget)
  // Note: Backend LoginManager already handles session invalidation with proper auth
  if (user?.id) {
    try {
      // SECURITY FIX: Clear middleware cache with proper authentication
      const bodyData = JSON.stringify({ type: 'login', userId: user.id });
      const { prepareCacheInvalidationHeaders } = await import("@/utils/cache-signature");
      const headers = await prepareCacheInvalidationHeaders(bodyData);

      void fetch('/api/auth/invalidate-cache', {
        method: 'POST',
        headers,
        body: bodyData
      }).catch(() => {});
    } catch {
      // Ignore errors - cache invalidation is best effort
    }
  }
  
  return res;
}
