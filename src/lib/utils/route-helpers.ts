import { NextResponse } from "next/server";
import { forwardSetCookies } from "../utils/cookie-helpers";

/**
 * Build a Next.js response from a backend fetch Response.
 * - Returns 204 with empty body when backend status is 204
 * - Otherwise returns JSON body with backend status
 * - Optionally forwards Set-Cookie headers from backend
 */
export async function proxyJsonOrNoContent(
  resp: Response,
  options?: { forwardCookies?: boolean }
) {
  if (resp.status === 204 || resp.status === 304) {
    const res = new NextResponse(null, { status: resp.status });
    if (options?.forwardCookies) forwardSetCookies(resp, res);
    return res;
  }

  const data = await resp.json().catch(() => ({}));
  const res = NextResponse.json(data, { status: resp.status });
  if (options?.forwardCookies) forwardSetCookies(resp, res);
  return res;
}
