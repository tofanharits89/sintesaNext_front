import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendPath } from "@/lib/backend";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { username, password, captcha, expectedCaptcha } = body as {
    username?: string;
    password?: string;
    captcha?: string;
    expectedCaptcha?: string;
  };

  // Validate captcha client-side as before
  if (captcha !== expectedCaptcha) {
    return NextResponse.json({ ok: false, error: "Invalid captcha" });
  }

  // Call backend login API and forward Set-Cookie headers
  let cookie = request.headers.get("cookie") || "";
  let xsrf =
    request.cookies.get("XSRF-TOKEN")?.value ||
    request.cookies.get("_csrf")?.value;

  // If no XSRF token present, prime it by calling backend /csrf-token and reuse its cookies for login
  let csrfSetCookies: string[] = [];
  if (!xsrf) {
    const csrfResp = await fetch(backendPath("/csrf-token"), {
      method: "GET",
      headers: { ...(cookie ? { cookie } : {}) },
      credentials: "include",
      cache: "no-store",
    });
    // Collect Set-Cookie values to forward to client later
    for (const [k, v] of csrfResp.headers)
      if (k.toLowerCase() === "set-cookie") csrfSetCookies.push(v);
    // Try to extract XSRF-TOKEN value from Set-Cookie
    const xsrfCookie = csrfSetCookies.find((c) => c.startsWith("XSRF-TOKEN="));
    if (xsrfCookie) {
      const nameValue = xsrfCookie.split(";")[0]; // XSRF-TOKEN=...
      xsrf = nameValue.split("=")[1];
      // Merge cookies for the subsequent login fetch
      const newCookies = csrfSetCookies.map((c) => c.split(";")[0]).join("; ");
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
    body: JSON.stringify({ username, password }),
    // Ensure cookies from backend are included so Next can forward them
    credentials: "include",
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data?.success) {
    const errRes = NextResponse.json(
      { ok: false, error: data?.message || "Login failed" },
      { status: resp.status || 401 }
    );
    // Forward any Set-Cookie headers (e.g., partial cookies) from backend even on failure
    for (const [key, value] of resp.headers) {
      if (key.toLowerCase() === "set-cookie")
        errRes.headers.append("set-cookie", value);
    }
    return errRes;
  }

  // Collect Set-Cookie headers to forward them to the browser (cookies carry auth)
  const setCookieValues: string[] = [];
  for (const [key, value] of resp.headers) {
    if (key.toLowerCase() === "set-cookie") setCookieValues.push(value);
  }

  const user = data?.data?.user || null;
  const responseBody = {
    ok: true,
    success: true,
    username: user?.username || username,
    data: { user },
  };

  const res = NextResponse.json(responseBody, { status: 200 });
  // Forward all Set-Cookie headers to client
  for (const v of setCookieValues) res.headers.append("set-cookie", v);

  return res;
}
