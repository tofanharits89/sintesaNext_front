import { NextRequest, NextResponse } from "next/server";
import { backendPath } from "@/lib/backend";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = req.cookies.get("token")?.value;
    const resp = await fetch(backendPath("/analytics/menu-usage"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
