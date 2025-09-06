import { NextResponse } from "next/server";
import { backendPath } from "@/lib/backend";

export async function POST() {
  // Call backend logout to invalidate session; forward any Set-Cookie clears
  const resp = await fetch(backendPath("/auth/logout"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  const body = await resp.json().catch(() => ({ ok: resp.ok }));

  const res = NextResponse.json(body, { status: resp.ok ? 200 : resp.status });

  // Forward backend Set-Cookie clears; also clear legacy client cookies
  const getSetCookie = (resp.headers as any).getSetCookie?.bind(resp.headers);
  const cookiesFromBackend: string[] = getSetCookie ? getSetCookie() : [];
  if (cookiesFromBackend.length > 0) {
    for (const c of cookiesFromBackend) res.headers.append("set-cookie", c);
  } else {
    const single = resp.headers.get("set-cookie");
    if (single) res.headers.set("set-cookie", single);
  }

  res.cookies.set("token", "", { path: "/", maxAge: 0 });
  res.cookies.set("socket_token", "", { path: "/", maxAge: 0 });
  res.cookies.set("authState", "", { path: "/", maxAge: 0 });
  res.cookies.set("auth_user", "", { path: "/", maxAge: 0 });
  return res;
}
