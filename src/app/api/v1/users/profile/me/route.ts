import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendPath } from "@/lib/config/config";
import { forwardSetCookies, createCookieHeader } from "@/lib/utils/cookie-helpers";

export async function GET(request: NextRequest) {
  try {
    // Build cookie header robustly across runtimes
    const cookieHeader = createCookieHeader(request);
    const hasSid = request.cookies.get('sid')?.value || /(?:^|;\s*)sid=/.test(cookieHeader);
    if (!hasSid) {
      if (process.env.NEXT_PUBLIC_DEBUG_AUTH === 'true') {
        console.log('[v1 users/profile/me] No sid cookie present');
      }
      return NextResponse.json(
        { success: false, message: "No session" },
        { status: 401 }
      );
    }

    const resp = await fetch(backendPath("/users/profile/me"), {
      method: "GET",
      headers: { ...(cookieHeader ? { cookie: cookieHeader } : {}) },
      credentials: "include",
      cache: "no-store",
    });
    if (process.env.NEXT_PUBLIC_DEBUG_AUTH === 'true') {
      console.log('[v1 users/profile/me] Backend status:', resp.status);
    }

    const data = await resp.json().catch(() => ({}));
    const res = NextResponse.json(data, { status: resp.status });
    forwardSetCookies(resp, res);
    return res;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Proxy error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieHeader = createCookieHeader(request);
    const hasSid = request.cookies.get('sid')?.value || /(?:^|;\s*)sid=/.test(cookieHeader);
    if (!hasSid) {
      return NextResponse.json({ success: false, message: "No session" }, { status: 401 });
    }

    const body = await request.json();
    
    // Pass CSRF token if present
    const csrfToken = request.headers.get("x-csrf-token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(cookieHeader ? { cookie: cookieHeader } : {})
    };
    if (csrfToken) headers["x-csrf-token"] = csrfToken;

    const resp = await fetch(backendPath("/users/profile/me"), {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
      credentials: "include",
    });

    const data = await resp.json().catch(() => ({}));
    const res = NextResponse.json(data, { status: resp.status });
    forwardSetCookies(resp, res);
    return res;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Proxy error" },
      { status: 500 },
    );
  }
}
