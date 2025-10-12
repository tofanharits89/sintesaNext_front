import { NextRequest } from "next/server";
import { backendPath } from "@/lib/backend";

export async function GET(request: NextRequest) {
  const incomingCookie = request.headers.get("cookie") || "";

  const resp = await fetch(backendPath("/csrf-token"), {
    method: "GET",
    headers: {
      ...(incomingCookie ? { cookie: incomingCookie } : {}),
    },
    cache: "no-store",
  });

  const { proxyJsonOrNoContent } = await import("@/lib/route-helpers");
  return proxyJsonOrNoContent(resp, { forwardCookies: true });
}
