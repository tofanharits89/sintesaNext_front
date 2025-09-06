import { NextRequest, NextResponse } from "next/server";
import { backendPath } from "@/lib/backend";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const limit = searchParams.get("limit") || "50";

    const url = new URL(backendPath("/analytics/menu-usage/top"));
    if (month) url.searchParams.set("month", month);
    url.searchParams.set("limit", limit);

    const cookie = req.headers.get("cookie") || "";

    const resp = await fetch(url.toString(), {
      method: "GET",
      headers: {
        ...(cookie ? { cookie } : {}),
      },
      cache: "no-store",
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
