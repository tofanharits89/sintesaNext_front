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

  // Call backend login API
  const resp = await fetch(backendPath("/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data?.success) {
    return NextResponse.json(
      { ok: false, error: data?.message || "Login failed" },
      { status: 200 }
    );
  }

  const res = NextResponse.json({
    ok: true,
    username: data.data?.user?.username || username,
  });

  // Set cookies for compatibility with existing middleware/auth-guard
  if (data.data?.accessToken) {
    // Main token for server-side authentication (httpOnly for security)
    res.cookies.set("token", data.data.accessToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    // Socket token for client-side socket authentication (non-httpOnly)
    res.cookies.set("socket_token", data.data.accessToken, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
    });
    // Auth state token for frontend authentication checking (non-httpOnly, matches backend)
    res.cookies.set("authState", data.data.accessToken, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
    });
  }
  if (data.data?.user?.username) {
    res.cookies.set("auth_user", data.data.user.username, {
      httpOnly: false,
      path: "/",
    });
  }

  return res;
}
