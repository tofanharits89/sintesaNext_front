import { NextRequest, NextResponse } from "next/server";
import { backendPath } from "@/lib/api/backend";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Forward Cookie header to backend; rely on httpOnly cookies
    const cookie = request.headers.get("cookie") || "";
    if (!cookie) {
      return NextResponse.json(
        { success: false, message: "No session" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));

    const resp = await fetch(backendPath("/whatsapp/send"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { cookie } : {}),
      },
      body: JSON.stringify(body),
    });

    const { proxyJsonOrNoContent } = await import("@/lib/utils/route-helpers");
    return proxyJsonOrNoContent(resp);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Proxy error" },
      { status: 500 }
    );
  }
}
