import { NextResponse } from "next/server";
import { backendPath } from "@/lib/backend";
import { forwardSetCookies } from "@/lib/cookie-helpers";

export async function POST() {
  // Call backend logout to invalidate session; forward any Set-Cookie clears
  const resp = await fetch(backendPath("/auth/logout"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  const body = await resp.json().catch(() => ({ ok: resp.ok }));

  const res = NextResponse.json(body, { status: resp.ok ? 200 : resp.status });

  // Forward backend Set-Cookie clears; also clear legacy client cookies
  forwardSetCookies(resp, res);

  // Best-effort clearing of legacy non-httpOnly names
  res.cookies.set("token", "", { path: "/", maxAge: 0 });
  res.cookies.set("socket_token", "", { path: "/", maxAge: 0 });
  res.cookies.set("authState", "", { path: "/", maxAge: 0 });
  res.cookies.set("auth_user", "", { path: "/", maxAge: 0 });
  return res;
}
