import { NextRequest, NextResponse } from "next/server";
import { backendPath } from "@/lib/backend";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Forward Cookie header to backend; rely on httpOnly cookies
    const cookie = request.headers.get("cookie") || "";
    if (!cookie) {
      return NextResponse.json(
        { success: false, message: "No session" },
        { status: 401 }
      );
    }

    const resp = await fetch(backendPath("/whatsapp/qr"), {
      method: "GET",
      headers: cookie ? { cookie } : {},
      cache: "no-store",
    });

    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Proxy error" },
      { status: 500 }
    );
  }
}
