import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendPath } from "@/lib/api/backend";
import { forwardSetCookies } from "@/lib/utils/cookie-helpers";

export async function POST(request: NextRequest) {
  const cookie = request.headers.get("cookie") || "";
  const xsrfToken = request.cookies.get("XSRF-TOKEN")?.value;
  const dbgSrc = request.headers.get("x-debug-source");
  const dbgTrace = request.headers.get("x-debug-trace");
  const dbgTs = request.headers.get("x-debug-ts");

  console.log("[API /auth/refresh] Incoming cookies present:", !!cookie);
  console.log("[API /auth/refresh] Has XSRF cookie:", !!xsrfToken);
  if (dbgSrc || dbgTrace || dbgTs) {
    console.log("[API /auth/refresh] Debug headers:", { src: dbgSrc, trace: dbgTrace, ts: dbgTs });
  }

  try {
    const resp = await fetch(backendPath("/auth/refresh"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { cookie } : {}),
        ...(xsrfToken ? { "X-CSRF-Token": xsrfToken } : {}),
        ...(dbgSrc ? { "X-Debug-Source": String(dbgSrc) } : {}),
        ...(dbgTrace ? { "X-Debug-Trace": String(dbgTrace) } : {}),
        ...(dbgTs ? { "X-Debug-Ts": String(dbgTs) } : {}),
      },
      credentials: "include",
      cache: "no-store",
    });

    const text = await resp.text();
    let data: any = {};
    try { data = JSON.parse(text); } catch { data = { message: text }; }

    console.log("[API /auth/refresh] Backend status:", resp.status);
    if (!resp.ok) {
      console.log("[API /auth/refresh] Backend error body:", data);
      const errRes = NextResponse.json(
        { success: false, error: data?.message || "Token refresh failed" },
        { status: resp.status }
      );
      // Do not forward Set-Cookie on 401 to avoid clearing tokens during client refresh
      if (resp.status !== 401) {
        forwardSetCookies(resp, errRes);
      }
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
