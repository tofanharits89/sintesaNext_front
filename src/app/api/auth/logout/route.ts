import { NextResponse } from "next/server";
import { backendPath } from "@/lib/backend";

export async function POST() {
  // Optional: call backend to invalidate session (if sessionId provided via client)
  const res = NextResponse.json({ ok: true });
  res.cookies.set("token", "", { path: "/", maxAge: 0 });
  res.cookies.set("socket_token", "", { path: "/", maxAge: 0 });
  res.cookies.set("authState", "", { path: "/", maxAge: 0 });
  res.cookies.set("auth_user", "", { path: "/", maxAge: 0 });
  return res;
}
