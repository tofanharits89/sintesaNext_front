import { NextRequest, NextResponse } from "next/server";
import { backendPath } from "@/lib/backend";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cookie = req.headers.get("cookie") || "";
  const { searchParams } = new URL(req.url);
  const npwp = searchParams.get("npwp");
  const vendor = searchParams.get("vendor");
  const limit = searchParams.get("limit");

  try {
    const qp = new URLSearchParams();
    if (npwp) qp.set("npwp", npwp);
    if (vendor) qp.set("vendor", vendor);
    if (limit) qp.set("limit", limit);
    const qs = qp.toString();

    const upstream = backendPath(`/supplier-analytics/profile${qs ? `?${qs}` : ""}`);
    const resp = await fetch(upstream, {
      method: "GET",
      headers: cookie ? { cookie } : {},
      cache: "no-store",
    });
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e?.message || "Upstream error" }, { status: 500 });
  }
}
