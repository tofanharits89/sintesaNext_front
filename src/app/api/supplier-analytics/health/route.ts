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
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, message: e?.message || "Upstream error" },
      { status: 500 },
    );
  }
}
