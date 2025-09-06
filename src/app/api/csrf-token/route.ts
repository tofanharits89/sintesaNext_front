import { NextRequest, NextResponse } from "next/server";
import { backendPath } from "@/lib/backend";

export async function GET(request: NextRequest) {
  const incomingCookie = request.headers.get("cookie") || "";

  const resp = await fetch(backendPath("/csrf-token"), {
    method: "GET",
    headers: {
      ...(incomingCookie ? { cookie: incomingCookie } : {}),
    },
    cache: "no-store",
  });

  const body = await resp.json().catch(() => ({}));
  const res = NextResponse.json(body, { status: resp.status });

  // Forward Set-Cookie headers from backend so browser stores XSRF-TOKEN and _csrf
  const getSetCookie = (resp.headers as any).getSetCookie?.bind(resp.headers);
  const cookiesFromBackend: string[] = getSetCookie ? getSetCookie() : [];
  if (cookiesFromBackend.length > 0) {
    for (const c of cookiesFromBackend) res.headers.append("set-cookie", c);
  } else {
    const single = resp.headers.get("set-cookie");
    if (single) res.headers.set("set-cookie", single);
  }

  return res;
}
