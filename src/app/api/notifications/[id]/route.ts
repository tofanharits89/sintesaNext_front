import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendPath } from "@/lib/backend";

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const token = request.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ success: false, message: "No token" }, { status: 401 });

  const { id } = params;
  const resp = await fetch(backendPath(`/notifications/${id}`), {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  let data: any = {};
  try {
    data = await resp.json();
  } catch {
    // ignore parse error, backend may return empty body on success
  }
  return NextResponse.json(data, { status: resp.status });
}

