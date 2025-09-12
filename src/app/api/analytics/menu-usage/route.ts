import { NextRequest, NextResponse } from "next/server";
import { backendPath } from "@/lib/backend";

// Helper to extract a cookie value from a Cookie header
function extractCookie(name: string, cookieHeader: string): string | undefined {
  try {
    const parts = cookieHeader.split(";");
    for (const part of parts) {
      const [k, ...rest] = part.trim().split("=");
      if (k === name) return decodeURIComponent(rest.join("="));
    }
  } catch {}
  return undefined;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const cookie = req.headers.get("cookie") || "";

    // Prefer CSRF header from client (axios sets X-CSRF-Token), fallback to cookie XSRF-TOKEN
    const headerCsrf = req.headers.get("x-csrf-token") || req.headers.get("x-xsrf-token");
    const cookieCsrf = cookie ? extractCookie("XSRF-TOKEN", cookie) : undefined;
    const csrf = headerCsrf || cookieCsrf;

    const resp = await fetch(backendPath("/analytics/menu-usage"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { cookie } : {}),
        ...(csrf ? { "X-CSRF-Token": String(csrf) } : {}),
      },
      body: JSON.stringify(body),
      cache: "no-store",
      keepalive: true,
    });

    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, message: e.message },
      { status: 500 }
    );
  }
}
