import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendPath } from "@/lib/backend";
import { forwardSetCookies } from "@/lib/cookie-helpers";

export async function GET(request: NextRequest) {
  const cookie = request.headers.get("cookie") || "";
  
  console.log("[API /auth/me] Incoming cookies:", cookie);
  console.log("[API /auth/me] All request headers:", Object.fromEntries(request.headers.entries()));

  try {
    const resp = await fetch(backendPath("/auth/me"), {
      method: "GET",
      headers: {
        ...(cookie ? { cookie } : {}),
      },
      credentials: "include",
      cache: "no-store",
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      const errRes = NextResponse.json(
        { success: false, error: data?.message || "Failed to fetch user" },
        { status: resp.status }
      );
      // Forward any Set-Cookie headers even on error (for token refresh)
      forwardSetCookies(resp, errRes);
      return errRes;
    }

    const res = NextResponse.json(data, { status: 200 });
    // Forward any Set-Cookie headers from backend
    forwardSetCookies(resp, res);
    return res;
  } catch (error: any) {
    console.error("[API /auth/me] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
