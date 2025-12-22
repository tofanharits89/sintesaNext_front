import { NextRequest, NextResponse } from "next/server";
import { backendPath } from "@/lib/config/config";
import { forwardSetCookies, createCookieHeader } from "@/lib/utils/cookie-helpers";

/**
 * GET /api/v1/auth/session
 * Proxy to backend session endpoint
 * Returns both session validation and user data in one call
 */
export async function GET(request: NextRequest) {
  const cookieHeader = createCookieHeader(request);
  const hasSid = request.cookies.get('sid')?.value || /(?:^|;\s*)sid=/.test(cookieHeader);

  if (!hasSid) {
    return NextResponse.json({
      success: true,
      data: {
        valid: false,
        authenticated: false,
        user: null,
        reason: "No session cookie"
      }
    }, { status: 200 });
  }

  try {
    const resp = await fetch(backendPath("/auth/session"), {
      method: "GET",
      headers: {
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
        'Accept': 'application/json',
      },
      credentials: "include",
      cache: "no-store",
    });

    const data = await resp.json().catch(() => ({}));
    const res = NextResponse.json(data, { status: resp.status });
    forwardSetCookies(resp, res);
    return res;
  } catch (error) {
    console.error("Session proxy error:", error);
    return NextResponse.json({
      success: true,
      data: {
        valid: false,
        authenticated: false,
        user: null,
        reason: "Server error"
      }
    }, { status: 200 });
  }
}