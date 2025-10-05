import { NextRequest, NextResponse } from "next/server";
import { backendPath } from "@/lib/backend";

// Proxy backend auth health to a stable frontend route
// HEAD for fast probes; GET returns JSON status
export async function HEAD(_request: NextRequest) {
  try {
    const resp = await fetch(backendPath("/health"), {
      method: "GET",
      cache: "no-store",
    });
    return new NextResponse(null, { status: resp.ok ? 200 : resp.status || 503 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}

export async function GET(_request: NextRequest) {
  try {
    const resp = await fetch(backendPath("/health"), {
      method: "GET",
      cache: "no-store",
    });

    // Try to parse backend JSON; normalize shape
    const data = await resp.json().catch(() => ({}));

    // Accept both { success: true, data: {...} } and { status: "healthy" }
    const normalized = data?.success
      ? data
      : { success: resp.ok, data: data?.data ?? data, status: data?.status };

    const res = NextResponse.json(normalized, { status: resp.ok ? 200 : resp.status || 503 });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (e) {
    return NextResponse.json(
      { success: false, data: { status: "unhealthy" } },
      { status: 503 }
    );
  }
}
