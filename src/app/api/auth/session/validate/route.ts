import { NextRequest, NextResponse } from "next/server";
import { backendPath } from "@/lib/backend";

export async function GET(request: NextRequest) {
  try {
    const cookie = request.headers.get("cookie") || "";
    if (!cookie) {
      return NextResponse.json(
        { success: false, message: "No session" },
        { status: 401 }
      );
    }

    const resp = await fetch(backendPath("/auth/session/validate"), {
      method: "GET",
      headers: { ...(cookie ? { cookie } : {}) },
      cache: "no-store",
    });

    const { proxyJsonOrNoContent } = await import("@/lib/route-helpers");
    return proxyJsonOrNoContent(resp);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Proxy error" },
      { status: 500 }
    );
  }
}

