import { NextRequest, NextResponse } from "next/server";
import { backendPath } from "@/lib/api/backend";
import { forwardSetCookies } from "@/lib/utils/cookie-helpers";

export async function POST(_request: NextRequest) {
  const cookie = _request.headers.get("cookie") || "";
  
  // Extract CSRF token from request headers (sent by frontend)
  const csrfToken = _request.headers.get("x-csrf-token") || 
                    _request.headers.get("X-CSRF-Token") ||
                    _request.headers.get("X-XSRF-TOKEN");

  const resp = await fetch(backendPath("/auth/logout"), {
    method: "POST",
    headers: { 
      ...(cookie ? { cookie } : {}), 
      ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}) 
    },
    credentials: "include",
    cache: "no-store",
  });
  const body = await resp.json().catch(() => ({ ok: resp.ok }));
  const res = NextResponse.json(body, { status: resp.ok ? 200 : resp.status });
  forwardSetCookies(resp, res);
  return res;
}

