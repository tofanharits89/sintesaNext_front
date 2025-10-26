import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendPath } from "@/lib/api/backend";
import { forwardSetCookies } from "@/lib/utils/cookie-helpers";

// GET /api/auth/validate
// Proxies validation to backend and forwards cookies. Matches /auth/me style.
export async function GET(request: NextRequest) {
  const cookie = request.headers.get("cookie") || "";
  const includeParam = request.nextUrl?.searchParams?.get("include");

  if (process.env.NEXT_PUBLIC_DEBUG_AUTH === 'true') {
    const namesOnly = cookie
      .split(';')
      .map((c) => c.trim().split('=')[0])
      .filter(Boolean);
    console.log('[API /auth/validate] Cookie names:', namesOnly);
  }

  // If no auth cookies at all, short-circuit with 401 to avoid stale cache usage
  const hasAccess = cookie.includes("access_token=") || cookie.includes("accessToken=");
  const hasRefresh = cookie.includes("refresh_token=") || cookie.includes("refreshToken=");
  if (!hasAccess && !hasRefresh) {
    if (process.env.NEXT_PUBLIC_DEBUG_AUTH === 'true') {
      console.log('[API /auth/validate] Short-circuit 401: no auth cookies detected');
    }
    return NextResponse.json(
      { success: false, error: "No authentication cookies" },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      },
    );
  }

  try {
    // Call backend /auth/validate endpoint
    const path = includeParam
      ? `/auth/validate?include=${encodeURIComponent(includeParam)}`
      : "/auth/validate";
    const resp = await fetch(backendPath(path), {
      method: "GET",
      headers: {
        ...(cookie ? { cookie } : {}),
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
        // include credentials to forward cookies in edge/node runtimes
      credentials: "include",
      cache: "no-store",
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      const errRes = NextResponse.json(
        { success: false, error: data?.message || "Validation failed" },
        {
          status: resp.status,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
            Pragma: "no-cache",
          },
        },
      );
      // Forward Set-Cookie even on error to allow token rotation/clears
      forwardSetCookies(resp, errRes);
      return errRes;
    }

    const res = NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    });
    forwardSetCookies(resp, res);
    return res;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      },
    );
  }
}
