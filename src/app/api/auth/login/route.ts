import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendPath } from "@/lib/api/backend";
import { forwardSetCookies } from "@/lib/utils/cookie-helpers";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { username, password, captcha, expectedCaptcha, rememberMe } = body as {
    username?: string;
    password?: string;
    captcha?: string;
    expectedCaptcha?: string;
    rememberMe?: boolean;
  };

  const resp = await fetch(backendPath("/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password, captcha, expectedCaptcha, rememberMe: Boolean(rememberMe) }),
  });

  const data = await resp.json().catch(() => ({}));

  console.log("[Login Route] Backend response status:", resp.status);

  if (!resp.ok || !data?.success) {
    console.error("[Login Route] Login failed - debugging data:", {
      dataKeys: Object.keys(data || {}),
      errorMessage: data?.error?.message,
      directMessage: data?.message,
      fullData: data
    });
    const errRes = NextResponse.json(
      { ok: false, error: data?.error?.message || data?.message || "Login failed" },
      { status: resp.status || 401 },
    );
    // Forward Set-Cookie headers from backend even on failure
    forwardSetCookies(resp, errRes);
    return errRes;
  }

  const user = data?.data?.user || null;

  console.log("[Login Route] LOGIN SUCCESS: ", user?.username);

  const responseBody = {
    ok: true,
    success: true,
    username: user?.username || username,
    data: { user },
  };

  const res = NextResponse.json(responseBody, { status: 200 });

  // Debug: Log Set-Cookie headers from backend
  const setCookies = resp.headers.get("set-cookie");
  console.log("[Login Route] Backend Set-Cookie headers received:", setCookies ? "Yes" : "No");
  console.log("[Login Route] Forwarding cookies to client...");

  // Forward all Set-Cookie headers to client via helper
  forwardSetCookies(resp, res);

  // Debug: Log forwarded headers
  const forwardedCookies = res.headers.getSetCookie?.() || [
    res.headers.get("set-cookie"),
  ];
  console.log("[Login Route] Forwarded Set-Cookie to client:", forwardedCookies?.length || 0, "cookies");
  console.log("[Login Route] ========== LOGIN REQUEST END ==========");

  // Clear middleware cache after successful login
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");

  // Clear middleware cache (fire-and-forget)
  // Note: Backend LoginManager already handles session invalidation with proper auth
  if (user?.id) {
    try {
      // SECURITY FIX: Clear middleware cache with proper authentication
      const bodyData = JSON.stringify({ type: "login", userId: user.id });
      const { prepareCacheInvalidationHeaders } = await import(
        "@/utils/cache-signature"
      );
      const headers = await prepareCacheInvalidationHeaders(bodyData);

      void fetch("/api/auth/invalidate-cache", {
        method: "POST",
        headers,
        body: bodyData,
      }).catch(() => {});
    } catch {
      // Ignore errors - cache invalidation is best effort
    }
  }

  return res;
}
