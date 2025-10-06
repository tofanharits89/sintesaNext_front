import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendPath } from "@/lib/backend";
import { forwardSetCookies } from "@/lib/cookie-helpers";

export async function POST(request: NextRequest) {
  const cookie = request.headers.get("cookie") || "";
  const xsrfToken = request.cookies.get("XSRF-TOKEN")?.value;

  try {
    const resp = await fetch(backendPath("/auth/refresh"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { cookie } : {}),
        ...(xsrfToken ? { "X-CSRF-Token": xsrfToken } : {}),
      },
      credentials: "include",
      cache: "no-store",
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      const errRes = NextResponse.json(
        { success: false, error: data?.message || "Token refresh failed" },
        { status: resp.status }
      );
      forwardSetCookies(resp, errRes);
      return errRes;
    }

    const res = NextResponse.json(data, { status: 200 });
    forwardSetCookies(resp, res);
    return res;
  } catch (error: any) {
    console.error("[API /auth/refresh] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
