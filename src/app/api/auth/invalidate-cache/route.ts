import { NextRequest, NextResponse } from "next/server";
import type { 
  CacheInvalidationRequest, 
  CacheInvalidationResponse, 
  CacheInvalidationError 
} from "@/types/cache-invalidation";

const DEBUG_CACHE = process.env.NEXT_PUBLIC_DEBUG_AUTH === "1";

/**
 * Internal cache invalidation endpoint
 * This endpoint is designed for internal use only and should not be exposed publicly
 */
export async function POST(req: NextRequest): Promise<NextResponse<CacheInvalidationResponse | CacheInvalidationError>> {
  try {
    // Security validation - ensure internal-only access
    const userAgent = req.headers.get("user-agent") || "";
    const referer = req.headers.get("referer") || "";
    const host = req.headers.get("host") || "";
    
    // Check if request is coming from internal sources
    const isInternalRequest = 
      userAgent.includes("Next.js") || // Next.js internal requests
      referer.includes(host) || // Same-origin requests
      req.headers.get("x-internal-request") === "true"; // Explicit internal header
    
    if (!isInternalRequest) {
      if (DEBUG_CACHE) {
        console.warn("[Cache] Unauthorized cache invalidation attempt", {
          userAgent,
          referer,
          host
        });
      }
      
      return NextResponse.json<CacheInvalidationError>({
        success: false,
        error: "Unauthorized access to internal endpoint",
        code: "UNAUTHORIZED",
        timestamp: new Date().toISOString()
      }, { status: 403 });
    }

    // Parse and validate request body
    let body: CacheInvalidationRequest;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json<CacheInvalidationError>({
        success: false,
        error: "Invalid JSON in request body",
        code: "INVALID_REQUEST",
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Validate required fields
    if (!body.sessionKey || typeof body.sessionKey !== 'string') {
      return NextResponse.json<CacheInvalidationError>({
        success: false,
        error: "sessionKey is required and must be a string",
        code: "INVALID_REQUEST",
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (!body.type || !['logout', 'session_expired', 'user_disabled'].includes(body.type)) {
      return NextResponse.json<CacheInvalidationError>({
        success: false,
        error: "type must be one of: logout, session_expired, user_disabled",
        code: "INVALID_REQUEST",
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Import CacheManager dynamically to avoid circular dependencies
    const { CacheManager } = await import("@/lib/cache-manager");
    const cacheManager = new CacheManager();

    // Perform cache invalidation based on type
    let clearedKeys: string[] = [];
    
    if (body.type === 'logout' && body.sessionKey === '*') {
      // Handle comprehensive login workflow invalidation
      const workflowResult = await cacheManager.executeLoginCacheInvalidationWorkflow();
      clearedKeys = workflowResult.clearedKeys;
      
      if (DEBUG_CACHE) {
        console.log("[Cache] Login workflow invalidation completed", workflowResult);
      }
    } else {
      // Handle standard session-specific invalidation
      clearedKeys = await cacheManager.invalidateAuthCache(body.sessionKey);
    }

    if (DEBUG_CACHE) {
      console.log("[Cache] Cache invalidation completed", {
        sessionKey: body.sessionKey,
        type: body.type,
        userId: body.userId,
        clearedKeys
      });
    }

    const response: CacheInvalidationResponse = {
      success: true,
      message: `Cache invalidated for session: ${body.sessionKey}`,
      clearedKeys,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

  } catch (error) {
    console.error("[Cache] Cache invalidation error:", error);
    
    return NextResponse.json<CacheInvalidationError>({
      success: false,
      error: "Internal server error during cache invalidation",
      code: "INTERNAL_ERROR",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Only allow POST method
export async function GET() {
  return NextResponse.json<CacheInvalidationError>({
    success: false,
    error: "Method not allowed. Use POST.",
    code: "INVALID_REQUEST",
    timestamp: new Date().toISOString()
  }, { status: 405 });
}