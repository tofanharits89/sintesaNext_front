import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendPath } from "@/lib/backend";

export async function GET(request: NextRequest) {
  // Forward client cookies to backend; rely on backend to read httpOnly cookies
  const cookie = request.headers.get("cookie") || "";

  const resp = await fetch(backendPath("/auth/me"), {
    method: "GET",
    headers: cookie ? { cookie } : {},
    cache: "no-store",
  });
  const data = await resp.json().catch(() => ({}));

  if (!resp.ok || !data?.success) {
    return NextResponse.json({ success: false, data: null }, { status: 200 });
  }

  const user = data.data?.user || data.data;
  return NextResponse.json({ success: true, data: user }, { status: 200 });
}
