import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendPath } from "@/lib/api/backend";

/**
 * Check if current session is still valid
 * This is called periodically by the frontend to detect session expiration
 */
export async function GET(request: NextRequest) {
  try {
    const cookie = request.headers.get("cookie") || "";
    
    // Call backend session validation
    const resp = await fetch(backendPath("/auth/session/validate"), {
      method: "GET",
      headers: cookie ? { cookie } : {},
      cache: "no-store",
    });

    const data = await resp.json().catch(() => ({}));
    
    if (!resp.ok || !data?.success) {
      return NextResponse.json(
        { 
          valid: false, 
          reason: data?.message || "Session invalid",
          code: "SESSION_INVALID"
        },
        { status: 401 }
      );
    }

    return NextResponse.json({ 
      valid: true,
      user: data?.data?.user
    });

  } catch (error) {
    console.error("[CheckSession] Error:", error);
    return NextResponse.json(
      { 
        valid: false, 
        reason: "Internal error",
        code: "INTERNAL_ERROR"
      },
      { status: 500 }
    );
  }
}
