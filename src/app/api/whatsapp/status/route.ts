import { NextRequest, NextResponse } from "next/server";
import { backendPath } from "@/lib/api/backend";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const cookie = request.headers.get("cookie") || "";
    if (!cookie) {
      return NextResponse.json(
        { success: false, message: "No session" },
        { status: 401 }
      );
    }

    const backendUrl = backendPath("/whatsapp/status");
    console.log("[WhatsApp Status] Fetching from:", backendUrl);

    const resp = await fetch(backendUrl, {
      method: "GET",
      headers: cookie ? { cookie } : {},
      cache: "no-store",
    });

    console.log("[WhatsApp Status] Backend response status:", resp.status);

    if (!resp.ok) {
      const errorText = await resp.text().catch(() => "Unknown error");
      console.error("[WhatsApp Status] Backend error:", errorText);
      return NextResponse.json(
        { success: false, error: errorText || "Backend error" },
        { status: resp.status }
      );
    }

    const { proxyJsonOrNoContent } = await import("@/lib/utils/route-helpers");
    return proxyJsonOrNoContent(resp);
  } catch (error: any) {
    console.error("[WhatsApp Status] Proxy error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Proxy error" },
      { status: 500 }
    );
  }
}
