import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendPath } from "@/lib/backend";
import { forwardSetCookies, getSetCookieValues, extractCookieMetadata } from "@/lib/cookie-helpers";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { username, password, captcha, expectedCaptcha } = body as {
    username?: string;
    password?: string;
    captcha?: string;
    expectedCaptcha?: string;
  };

  console.log("[Login Route] ========== LOGIN REQUEST START ==========");
  console.log("[Login Route] Username attempting to login:", username);
  const cookieMetadata = extractCookieMetadata(request.headers.get("cookie") || "");
  console.log("[Login Route] Incoming cookies metadata:", cookieMetadata);

  // Call backend login API and forward Set-Cookie headers
  let cookie = request.headers.get("cookie") || "";
  let xsrf =
    request.cookies.get("XSRF-TOKEN")?.value ||
    request.cookies.get("_csrf")?.value;

  // CRITICAL: Check if old auth cookies are present (both old and new names)
  const hasOldAccessToken = cookie.includes("accessToken=") || cookie.includes("access_token=");
  const hasOldRefreshToken = cookie.includes("refreshToken=") || cookie.includes("refresh_token=");

  if (hasOldAccessToken || hasOldRefreshToken) {
    console.warn("[Login Route] ⚠️ OLD AUTH COOKIES DETECTED!");
    console.warn("[Login Route] Old auth cookies detected:", {
      hasAccessToken: hasOldAccessToken,
      hasRefreshToken: hasOldRefreshToken,
      cookieCount: cookie.split(';').filter(c => c.trim()).length
    });
    console.warn(
      "[Login Route] These old cookies will be sent to backend and might cause issues!",
    );

    // Strip old auth cookies before sending to backend (both old and new names)
    const cookieParts = cookie.split(";").map((c) => c.trim());
    const filteredCookies = cookieParts.filter(
      (c) =>
        !c.startsWith("accessToken=") &&
        !c.startsWith("access_token=") &&
        !c.startsWith("refreshToken=") &&
        !c.startsWith("refresh_token=") &&
        !c.startsWith("authToken=") &&
        !c.startsWith("auth_token="),
    );
    cookie = filteredCookies.join("; ");
    const newMetadata = extractCookieMetadata(cookie);
    console.log("[Login Route] Stripped old auth cookies. New metadata:", newMetadata);
  }

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
        .map((c) => c.split(";")[0] ?? "")
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
      const xsrfCookie2 = allSetCookies2.find((c) =>
        c.startsWith("XSRF-TOKEN="),
      );
      if (xsrfCookie2) {
        const nameValue = xsrfCookie2.split(";")[0] ?? "";
        const parts = nameValue.split("=");
        xsrf = parts.length > 1 ? parts[1] : xsrf;
        const merged = allSetCookies2
          .filter(Boolean)
          .map((c) => c.split(";")[0] ?? "")
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

  console.log("[Login Route] Backend response status:", resp.status);
  console.log("[Login Route] Backend response data:", {
    success: data?.success,
    username: data?.data?.user?.username,
    userId: data?.data?.user?.id,
  });

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

  console.log("[Login Route] ========== LOGIN SUCCESS ==========");
  console.log("[Login Route] Backend returned user:", {
    username: user?.username,
    id: user?.id,
    role: user?.role,
  });

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
