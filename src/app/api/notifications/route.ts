import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendPath } from "@/lib/backend";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ success: false, message: "No token" }, { status: 401 });

  const resp = await fetch(backendPath("/notifications"), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data = await resp.json().catch(() => ({}));
  return NextResponse.json(data, { status: resp.status });
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ success: false, message: "No token" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const resp = await fetch(backendPath("/notifications"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await resp.json().catch(() => ({}));
  return NextResponse.json(data, { status: resp.status });
}

