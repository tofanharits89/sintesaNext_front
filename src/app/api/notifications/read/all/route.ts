import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendPath } from "@/lib/backend";

export async function PUT(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ success: false, message: "No token" }, { status: 401 });

  const resp = await fetch(backendPath(`/notifications/read/all`), {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await resp.json().catch(() => ({}));
  return NextResponse.json(data, { status: resp.status });
}

