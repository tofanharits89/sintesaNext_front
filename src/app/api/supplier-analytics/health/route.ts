import { NextRequest, NextResponse } from "next/server";
import { backendPath } from "@/lib/backend";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cookie = req.headers.get("cookie") || "";
  try {
    const resp = await fetch(backendPath("/supplier-analytics/health"), {
      method: "GET",
      headers: cookie ? { cookie } : {},
      cache: "no-store",
    });
    const { proxyJsonOrNoContent } = await import("@/lib/route-helpers");
    return proxyJsonOrNoContent(resp);
  } catch (e: any) {
    return NextResponse.json(
      { success: false, message: e?.message || "Upstream error" },
      { status: 500 },
    );
  }
}
