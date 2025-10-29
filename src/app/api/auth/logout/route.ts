import { NextResponse, NextRequest } from "next/server";
import { createHash } from "crypto";
import { backendPath } from "@/lib/api/backend";
import { forwardSetCookies } from "@/lib/utils/cookie-helpers";

function extractCookie(cookiesHeader: string, name: string): string | null {
  if (!cookiesHeader) return null;
  const parts = cookiesHeader.split(";").map((c) => c.trim());
  const match = parts.find((c) => c.startsWith(`${encodeURIComponent(name)}=`));
  if (!match) return null;
  const value = match.split("=")[1] || "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function POST(req: NextRequest) {
  const incomingCookie = req.headers.get("cookie") ?? "";
  const incomingAuth = req.headers.get("authorization") ?? undefined;
  const headerTokenRaw =
    req.headers.get("x-csrf-token") || req.headers.get("x-xsrf-token");

  const normalizeToken = (raw: string | null): string | null => {
    if (!raw) return null;
    const candidates = raw
      .split(",")
      .map((part) => part.trim())
      .filter((part): part is string => part.length > 0);

    for (let i = candidates.length - 1; i >= 0; i -= 1) {
      const candidate = candidates[i] ?? "";
      if (/^[a-f0-9]{64}$/i.test(candidate)) {
        return candidate;
      }
    }

    return candidates.at(-1) ?? null;
  };

  const cookieToken = normalizeToken(extractCookie(incomingCookie, "XSRF-TOKEN"));
  const headerToken = normalizeToken(headerTokenRaw);

  const diagnostic = (label: string, payload: Record<string, unknown>) => {
    if (process.env.NODE_ENV === "production") {
      try {
        process.stdout.write(`${label} ${JSON.stringify(payload)}\n`);
      } catch {
        // ignore logging failures
      }
    } else {
      console.warn(label, payload);
    }
  };

  diagnostic("[Logout API] CSRF sources", {
    headerPresent: !!headerTokenRaw,
    headerLength: headerTokenRaw?.length ?? 0,
    cookiePresent: !!cookieToken,
    cookieLength: cookieToken?.length ?? 0,
  });

  const baseHeaders: Record<string, string> = {};
  if (incomingCookie) baseHeaders["cookie"] = incomingCookie;
  if (incomingAuth) baseHeaders["authorization"] = incomingAuth;

  let csrfToken: string | null = null;
  let csrfSource: "fresh" | "header" | "cookie" | "none" = "none";

  // Try to mint a fresh CSRF token using the same cookies
  try {
    const csrfResp = await fetch(backendPath("/auth/csrf"), {
      method: "GET",
      headers: baseHeaders,
      credentials: "include",
      cache: "no-store",
    });
    const csrfJson: any = await csrfResp.json().catch(() => null);
    if (
      csrfResp.ok &&
      csrfJson &&
      typeof csrfJson === "object" &&
      csrfJson.data?.csrfToken
    ) {
      csrfToken = String(csrfJson.data.csrfToken);
      const expiresIn =
        typeof csrfJson.data.expiresIn === "number" ? csrfJson.data.expiresIn : undefined;
      csrfSource = "fresh";
      diagnostic("[Logout API] CSRF minted", {
        status: csrfResp.status,
        expiresIn,
        tokenLength: csrfToken.length,
      });
    } else {
      diagnostic("[Logout API] CSRF mint failed", {
        status: csrfResp.status,
        body: csrfJson,
      });
    }
  } catch (error) {
    diagnostic("[Logout API] CSRF mint error", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  if (!csrfToken && headerToken) {
    csrfToken = headerToken;
    csrfSource = "header";
  }

  if (!csrfToken && cookieToken) {
    csrfToken = cookieToken;
    csrfSource = "cookie";
  }

  diagnostic("[Logout API] CSRF selected", {
    source: csrfSource,
    tokenLength: csrfToken?.length ?? 0,
    tokenHash: csrfToken
      ? createHash("sha256").update(csrfToken).digest("hex").slice(0, 12)
      : null,
  });

  const logoutHeaders: Record<string, string> = {
    ...baseHeaders,
    "Content-Type": "application/json",
  };
  if (csrfToken) {
    logoutHeaders["X-CSRF-Token"] = csrfToken;
    logoutHeaders["X-CSRF-Token-Source"] = csrfSource;
    logoutHeaders["X-CSRF-Token-Hash"] = createHash("sha256")
      .update(csrfToken)
      .digest("hex");
    logoutHeaders["X-CSRF-Token-Len"] = String(csrfToken.length);
  }

  // Call backend logout to invalidate session; forward any Set-Cookie clears
  const resp = await fetch(backendPath("/auth/logout"), {
    method: "POST",
    headers: logoutHeaders,
    cache: "no-store",
    // Add credentials to ensure cookies are sent and received properly
    credentials: "include",
  });
  const body = await resp.json().catch(() => ({ ok: resp.ok }));

  const res = NextResponse.json(body, { status: resp.ok ? 200 : resp.status });

  // CRITICAL: Forward ALL backend Set-Cookie headers first
  // The backend is responsible for clearing HttpOnly cookies
  forwardSetCookies(resp, res);

  // Signal to middleware that a logout is in progress to avoid any
  // authenticated redirects or dashboard flashes during the redirect window.
  // Use a short‑lived, non-HTTP-only cookie so it is included immediately
  // on the next navigation request.
  try {
    // Prefer cookie API when available (Next 15)
    // Fallback to manual header if needed
    (res.cookies as any)?.set?.("logout_in_progress", "true", {
      path: "/",
      sameSite: "lax",
      httpOnly: false,
      maxAge: 15, // seconds
    });
  } catch {
    res.headers.append(
      "Set-Cookie",
      "logout_in_progress=true; Max-Age=15; Path=/; SameSite=Lax"
    );
  }

  // Invalidate Next middleware auth cache immediately
  try {
    // Extract access token from cookies to invalidate specific session (prefer access_token)
    const accessToken =
      extractCookie(incomingCookie, "access_token") ||
      extractCookie(incomingCookie, "accessToken");
    const sessionKey = accessToken || incomingCookie || "*";

    // Build absolute URL for cache invalidation
    const protocol = req.nextUrl.protocol;
    const host = req.headers.get("host") || req.nextUrl.host;
    const invalidateUrl = `${protocol}//${host}/api/auth/invalidate-cache`;

    const bodyData = JSON.stringify({
      type: "logout",
      sessionKey: sessionKey,
      userId: (req as any).user?.id, // Pass user ID if available
    });

    // SECURITY FIX: Use centralized signature generation
    const { prepareCacheInvalidationHeaders } = await import(
      "@/utils/cache-signature"
    );
    const headers = await prepareCacheInvalidationHeaders(bodyData);

    await fetch(invalidateUrl, {
      method: "POST",
      headers,
      cache: "no-store",
      body: bodyData,
    });
  } catch (err) {
    // Silently fail - cache will expire naturally
    console.error("[Logout] Cache invalidation failed:", err);
  }

  return res;
}
