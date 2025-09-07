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

  // Propagate backend status (e.g., 401/403) and disable caching
  if (!resp.ok || !data?.success) {
    const res = NextResponse.json(
      { success: false, data: null, message: data?.message || "Unauthorized" },
      { status: resp.status || 401 }
    );
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  const user = data.data?.user || data.data;
  const res = NextResponse.json({ success: true, data: user }, { status: 200 });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
