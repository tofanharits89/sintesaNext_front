import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendPath } from "@/lib/backend";
import { forwardSetCookies } from "@/lib/cookie-helpers";

export async function GET(request: NextRequest) {
  const cookie = request.headers.get("cookie") || "";

  // CRITICAL: If no auth cookies, return unauthenticated immediately
  // This prevents returning cached user data after logout
  if (!cookie.includes("access_token=") && !cookie.includes("refresh_token=") &&
      !cookie.includes("accessToken=") && !cookie.includes("refreshToken=")) {
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
    const resp = await fetch(backendPath("/auth/me"), {
      method: "GET",
      headers: {
        ...(cookie ? { cookie } : {}),
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      credentials: "include",
      cache: "no-store",
    });

    const data = await resp.json().catch(() => ({}));

    // DEBUG: Show what backend returns
    console.log("🔥 BACKEND /auth/me RESPONSE:", {
      status: resp.status,
      success: data?.success,
      username: data?.data?.user?.username,
      userId: data?.data?.user?.id,
      fullData: data,
    });

    if (!resp.ok) {
      const errRes = NextResponse.json(
        { success: false, error: data?.message || "Failed to fetch user" },
        {
          status: resp.status,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
            Pragma: "no-cache",
          },
        },
      );
      // Forward any Set-Cookie headers even on error (for token refresh)
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
    // Forward any Set-Cookie headers from backend
    forwardSetCookies(resp, res);
    return res;
  } catch (error: any) {
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
