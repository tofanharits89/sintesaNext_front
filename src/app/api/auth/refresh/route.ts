import { NextResponse, NextRequest } from "next/server";
import { cookies as nextCookies } from "next/headers";
import { backendPath } from "@/lib/backend";

export async function POST(request: NextRequest) {
  // Collect client cookies and forward to backend so it can read refreshToken
  const incomingCookie = request.headers.get("cookie") || "";
  // Forward CSRF headers if present
  const csrfHeaderCandidates = [
    "x-csrf-token",
    "X-CSRF-Token",
    "x-xsrf-token",
    "X-XSRF-TOKEN",
  ];
  const forwardedCsrfHeaders: Record<string, string> = {};
  for (const name of csrfHeaderCandidates) {
    const v = request.headers.get(name as any);
    if (v) forwardedCsrfHeaders[name] = v;
  }

  const resp = await fetch(backendPath("/auth/refresh-token"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Forward cookies to backend
      ...(incomingCookie ? { cookie: incomingCookie } : {}),
      // Forward CSRF headers (any that were provided)
      ...forwardedCsrfHeaders,
    },
  });

  const resBody = await resp.json().catch(() => ({}));

  const res = NextResponse.json(resBody, { status: resp.status });

  // Forward Set-Cookie from backend so browser updates httpOnly cookies
  // Forward one or multiple Set-Cookie headers
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
