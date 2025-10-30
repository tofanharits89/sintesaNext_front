// Deprecated: internal cache invalidation is no longer used.
import { NextResponse } from "next/server";
export async function POST() {
  return NextResponse.json({ ok: false, error: "gone" }, { status: 410 });
}
