import { NextResponse, NextRequest } from "next/server";
import { backendPath } from "@/lib/backend";
import { forwardSetCookies } from "@/lib/cookie-helpers";

function pickDeviceHeaders(req: NextRequest): Record<string, string> {
  const out: Record<string, string> = {};
  const copy = (n: string) => { const v = req.headers.get(n); if (v) out[n] = v; };
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
  // Collect client cookies and forward to backend so it can read refreshToken
  const incomingCookie = request.headers.get("cookie") || "";

  // Forward CSRF headers if present
  const csrfHeaderCandidates = [
    "x-csrf-token",
    "X-CSRF-Token",
    "x-xsrf-token",
    "X-XSRF-TOKEN",
  ] as const;

  const forwardedCsrfHeaders: Record<string, string> = {};
  for (const name of csrfHeaderCandidates) {
    const v = request.headers.get(name);
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
      // Forward device headers to maintain fingerprint continuity
      ...pickDeviceHeaders(request),
    },
    cache: "no-store",
  });

  const resBody = await resp.json().catch(() => ({}));

  const res = NextResponse.json(resBody, { status: resp.status });
  // Forward Set-Cookie from backend so browser updates httpOnly cookies
  forwardSetCookies(resp, res);

  return res;
}
