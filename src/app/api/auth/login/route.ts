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
      const nameValue = xsrfCookie.split(";")[0]; // XSRF-TOKEN=...
      xsrf = nameValue.split("=")[1];
      // Merge cookies for the subsequent login fetch
      const newCookies = allSetCookies
        .filter(Boolean)
        .map((c) => c.split(";")[0])
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
        const nameValue = xsrfCookie2.split(";")[0];
        xsrf = nameValue.split("=")[1];
        const merged = allSetCookies2
          .filter(Boolean)
          .map((c) => c.split(";")[0])
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

  return res;
}
