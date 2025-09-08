import { NextResponse, NextRequest } from "next/server";
import { backendPath } from "@/lib/backend";
import { forwardSetCookies } from "@/lib/cookie-helpers";

function extractCookie(cookiesHeader: string, name: string): string | null {
  if (!cookiesHeader) return null;
  const parts = cookiesHeader.split(";").map((c) => c.trim());
  const match = parts.find((c) => c.startsWith(`${encodeURIComponent(name)}=`));
  if (!match) return null;
  const value = match.split("=")[1] || "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function POST(req: NextRequest) {
  // Forward incoming cookies and CSRF to backend
  const incomingCookie = req.headers.get("cookie") ?? "";
  const xsrfFromCookie = extractCookie(incomingCookie, "XSRF-TOKEN");
  // Also honor any explicit CSRF headers from the client
  const incomingCsrfHeader =
    req.headers.get("x-csrf-token") || req.headers.get("x-xsrf-token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (incomingCookie) headers["cookie"] = incomingCookie;
  const csrf = incomingCsrfHeader || xsrfFromCookie;
  if (csrf) headers["X-CSRF-Token"] = String(csrf);

  // Call backend logout to invalidate session; forward any Set-Cookie clears
  const resp = await fetch(backendPath("/auth/logout"), {
    method: "POST",
    headers,
    cache: "no-store",
  });
  const body = await resp.json().catch(() => ({ ok: resp.ok }));

  const res = NextResponse.json(body, { status: resp.ok ? 200 : resp.status });

  // Forward backend Set-Cookie clears; also clear legacy client cookies
  forwardSetCookies(resp, res);

  // Aggressively clear auth cookies on the Next side as well (in case backend attributes don't match)
  const clearOpts = { path: "/", maxAge: 0 } as const;
  const clearHttpOnly = { ...clearOpts, httpOnly: true } as const;

  // HttpOnly cookies set by backend
  res.cookies.set("accessToken", "", clearHttpOnly);
  res.cookies.set("refreshToken", "", clearHttpOnly);
  // Legacy names
  res.cookies.set("access_token", "", clearHttpOnly);
  res.cookies.set("refresh_token", "", clearHttpOnly);
  res.cookies.set("authToken", "", clearHttpOnly);
  res.cookies.set("auth_token", "", clearHttpOnly);

  // Best-effort clearing of legacy non-httpOnly names
  res.cookies.set("token", "", clearOpts);
  res.cookies.set("socket_token", "", clearOpts);
  res.cookies.set("authState", "", clearOpts);
  res.cookies.set("auth_user", "", clearOpts);
  return res;
}
