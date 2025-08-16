import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendPath } from "@/lib/backend";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ success: false, message: "No token" }, { status: 401 });

  const resp = await fetch(backendPath("/notifications/admin"), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data = await resp.json().catch(() => ({}));
  return NextResponse.json(data, { status: resp.status });
}

