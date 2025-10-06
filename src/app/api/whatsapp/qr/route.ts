import { NextRequest, NextResponse } from "next/server";
import { backendPath } from "@/lib/backend";

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

    const backendUrl = backendPath("/whatsapp/qr");
    console.log("[WhatsApp QR] Fetching from:", backendUrl);

    const resp = await fetch(backendUrl, {
      method: "GET",
      headers: cookie ? { cookie } : {},
      cache: "no-store",
    });

    console.log("[WhatsApp QR] Backend response status:", resp.status);

    if (!resp.ok) {
      const errorText = await resp.text().catch(() => "Unknown error");
      console.error("[WhatsApp QR] Backend error:", errorText);
      return NextResponse.json(
        { success: false, error: errorText || "Backend error" },
        { status: resp.status }
      );
    }

    const data = await resp.json().catch(() => ({ success: false, error: "Invalid JSON response" }));
    return NextResponse.json(data, { status: resp.status });
  } catch (error: any) {
    console.error("[WhatsApp QR] Proxy error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Proxy error" },
      { status: 500 }
    );
  }
}
