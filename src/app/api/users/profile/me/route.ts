import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendPath } from "@/lib/backend";
import { forwardSetCookies } from "@/lib/cookie-helpers";

// Deprecated: cookie-only flow now forwards Cookie header to backend. Keep stub to avoid import errors.
function getAuthTokenFromCookies(_request: NextRequest): string | null {
  return null;
}

export async function GET(request: NextRequest) {
  const cookie = request.headers.get("cookie") || "";

  console.log("[API /users/profile/me] ========== REQUEST START ==========");
  console.log("[API /users/profile/me] Incoming cookies:", cookie);
  console.log(
    "[API /users/profile/me] Has access_token:",
    cookie.includes("access_token=") || cookie.includes("accessToken="),
  );
  console.log(
    "[API /users/profile/me] Has refresh_token:",
    cookie.includes("refresh_token=") || cookie.includes("refreshToken="),
  );

  // CRITICAL: If no auth cookies, return unauthenticated immediately
  // This prevents returning cached user data after logout
  if (!cookie.includes("access_token=") && !cookie.includes("accessToken=") &&
      !cookie.includes("refresh_token=") && !cookie.includes("refreshToken=")) {
    console.log(
      "[API /users/profile/me] ❌ No auth cookies found - returning unauthenticated",
    );
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

  // Call backend /users/profile/me endpoint
  const resp = await fetch(backendPath("/users/profile/me"), {
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

  console.log("[API /users/profile/me] Backend response status:", resp.status);
  console.log("[API /users/profile/me] Backend response data:", {
    success: data?.success,
    hasUser: !!data?.data?.user,
    username: data?.data?.user?.username,
  });

  if (!resp.ok) {
    console.log(
      "[API /users/profile/me] ❌ Backend returned error:",
      resp.status,
    );
    const errRes = NextResponse.json(
      { success: false, error: data?.message || "Failed to fetch profile" },
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

  console.log(
    "[API /users/profile/me] ✅ Backend returned user:",
    data?.data?.user?.username,
  );
  console.log("[API /users/profile/me] ========== REQUEST END ==========");

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
}

export async function PUT(request: NextRequest) {
  const cookie = request.headers.get("cookie") || "";

  if (!cookie) {
    return NextResponse.json(
      { success: false, message: "No session" },
      { status: 401 },
    );
  }

  const body = await request.json();

  // Call backend /users/profile/me endpoint
  const resp = await fetch(backendPath("/users/profile/me"), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });

  const data = await resp.json().catch(() => ({}));
  return NextResponse.json(data, { status: resp.ok ? 200 : resp.status });
}
