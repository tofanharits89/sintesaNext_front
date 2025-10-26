import { NextRequest, NextResponse } from "next/server";
import { backendPath } from "@/lib/api/backend";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cookie = req.headers.get("cookie") || "";
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year");
  try {
    const qs = year && /^\d{4}$/.test(year) ? `?year=${encodeURIComponent(year)}` : "";
    const resp = await fetch(backendPath(`/supplier-analytics/dashboard${qs}`), {
      method: "GET",
      headers: cookie ? { cookie } : {},
      cache: "no-store",
    });
    const { proxyJsonOrNoContent } = await import("@/lib/utils/route-helpers");
    return proxyJsonOrNoContent(resp);
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e?.message || "Upstream error" }, { status: 500 });
  }
}
