import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendPath } from "@/lib/api/backend";
import { forwardSetCookies } from "@/lib/utils/cookie-helpers";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const cookie = request.headers.get("cookie") || "";
  const { username, password, captcha, rememberMe } = body as {
    username?: string;
    password?: string;
    captcha?: string;
    rememberMe?: boolean;
  };

  const resp = await fetch(backendPath("/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}) },
    credentials: "include",
    body: JSON.stringify({ username, password, captcha, rememberMe: Boolean(rememberMe) }),
  });

  const data = await resp.json().catch(() => ({}));

  if (!resp.ok || !data?.success) {
    const errRes = NextResponse.json(
      { ok: false, error: data?.error?.message || data?.message || "Login failed" },
      { status: resp.status || 401 },
    );
    forwardSetCookies(resp, errRes);
    return errRes;
  }

  const user = data?.data?.user || null;
  const res = NextResponse.json(
    { ok: true, success: true, username: user?.username || username, data: { user } },
    { status: 200 },
  );

  forwardSetCookies(resp, res);
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return res;
}

