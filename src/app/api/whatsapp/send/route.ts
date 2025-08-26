import { NextRequest, NextResponse } from "next/server";
import { backendPath } from "@/lib/backend";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Accept token from cookie or Authorization header (fallback)
    const cookieToken = request.cookies.get("token")?.value;
    const fallbackAuth = request.headers.get("authorization");
    const auth = fallbackAuth || (cookieToken ? `Bearer ${cookieToken}` : null);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: "No token" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));

    const resp = await fetch(backendPath("/whatsapp/send"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: auth,
      },
      body: JSON.stringify(body),
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
