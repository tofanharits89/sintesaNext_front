import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendPath } from "@/lib/backend";
import { forwardSetCookies, getSetCookieValues } from "@/lib/cookie-helpers";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { username, password, captcha } = body as {
    username?: string;
    password?: string;
    captcha?: string;
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

  const resp = await fetch(backendPath("/auth/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { cookie } : {}),
      ...(xsrf ? { "X-CSRF-Token": xsrf } : {}),
    },
    body: JSON.stringify({ username, password, captcha }),
    // Ensure cookies from backend are included so Next can forward them
    credentials: "include",
  });

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
