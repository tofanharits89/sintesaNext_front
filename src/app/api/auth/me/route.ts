import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendPath } from "@/lib/backend";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if (!token)
    return NextResponse.json({ ok: false, username: null }, { status: 200 });

  // Verify token on backend (optional) and fetch user profile
  const resp = await fetch(backendPath("/auth/me"), {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await resp.json().catch(() => ({}));

  if (!resp.ok || !data?.success) {
    return NextResponse.json({ success: false, data: null }, { status: 200 });
  }

  // Return full user object to clients for consistent profile display
  const user = data.data?.user || data.data;
  return NextResponse.json({ success: true, data: user }, { status: 200 });
}
