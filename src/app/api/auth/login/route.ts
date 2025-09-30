import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendPath } from "@/lib/backend";
import { forwardSetCookies, getSetCookieValues } from "@/lib/cookie-helpers";

function pickDeviceHeaders(req: NextRequest): Record<string, string> {
  const h = req.headers;
  const out: Record<string, string> = {};
  const copy = (name: string) => {
    const v = h.get(name);
    if (v) out[name] = v;
  };
  [
    "user-agent",
    "accept-language",
    "sec-ch-ua",
    "sec-ch-ua-platform",
    "x-device-id",
    "x-device-timezone",
    "x-device-locale",
    "x-device-platform",
  ].forEach(copy);
  return out;
}

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
    const deviceHeaders = pickDeviceHeaders(request);
    return fetch(backendPath("/auth/login"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(currentCookie ? { cookie: currentCookie } : {}),
        ...(currentXsrf ? { "X-CSRF-Token": currentXsrf } : {}),
        ...deviceHeaders,
      },
      body: JSON.stringify({ username, password, captcha, expectedCaptcha }),
      // Ensure cookies from backend are included so Next can forward them
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
  // Forward all Set-Cookie headers to client via helper
  forwardSetCookies(resp, res);

  // Clear middleware cache after successful login
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  
  // Invalidate other sessions and clear middleware cache (fire-and-forget)
  if (user?.id) {
    try {
      // Kick off invalidation without blocking the response
      // Backend session invalidation
      void fetch(backendPath(`/auth/invalidate-user-sessions/${user.id}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).catch(() => {});

      // Clear middleware cache for this login on the frontend side
      void fetch('/api/auth/invalidate-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'login', userId: user.id })
      }).catch(() => {});
    } catch {
      // Ignore errors - session invalidation is best effort
    }
  }
  
  return res;
}
