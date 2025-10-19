import { NextRequest, NextResponse } from "next/server";
import { backendPath } from "@/lib/backend";

/**
 * @DEPRECATED This API route is deprecated and will be removed in a future version.
 *
 * Migration Guide:
 * This proxy route has been replaced with direct backend communication.
 * Please update your frontend code to use the directBackendClient instead:
 *
 * OLD: apiClient.post("/inquiry-data/query", data)
 * NEW: directBackendClient.post("/api/v1/inquiry-data/query", data)
 *
 * The new approach provides better performance, reduced latency, and simpler architecture.
 */

export async function POST(request: NextRequest) {
  console.warn(
    "[DEPRECATED] /api/inquiry-data/query is deprecated. " +
      "Please use directBackendClient to call /api/v1/inquiry-data/query directly.",
  );

  try {
    const cookie = request.headers.get("cookie") || "";
    // Forward CSRF headers if present so backend CSRF middleware can validate
    const csrfHeader = request.headers.get("x-csrf-token");
    const xsrfHeader = request.headers.get("x-xsrf-token");
    if (!cookie) {
      return NextResponse.json(
        {
          success: false,
          message: "No session",
          deprecation: {
            route: "/api/inquiry-data/query",
            alternative:
              "Use directBackendClient.post('/api/v1/inquiry-data/query')",
            status: "deprecated",
          },
        },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));

    const resp = await fetch(backendPath("/inquiry-data/query"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { cookie } : {}),
        ...(csrfHeader ? { "X-CSRF-Token": csrfHeader } : {}),
        ...(xsrfHeader ? { "X-XSRF-TOKEN": xsrfHeader } : {}),
        "X-Deprecation-Warning":
          "This route is deprecated. Use direct backend calls instead.",
      },
      body: JSON.stringify(body),
    });

    const contentType = resp.headers.get("content-type") || "";
    if (contentType.includes("text/csv")) {
      const newHeaders = new Headers(resp.headers);
      newHeaders.set(
        "X-Deprecation-Warning",
        "This route is deprecated. Use direct backend calls instead.",
      );
      return new NextResponse(resp.body, {
        status: resp.status,
        headers: newHeaders,
      });
    }

    const { proxyJsonOrNoContent } = await import("@/lib/route-helpers");
    const response = await proxyJsonOrNoContent(resp);

    // Add deprecation warning to response headers if possible
    if (response instanceof NextResponse) {
      response.headers.set(
        "X-Deprecation-Warning",
        "This route is deprecated. Use direct backend calls instead.",
      );
    }

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Proxy error",
        deprecation: {
          route: "/api/inquiry-data/query",
          alternative:
            "Use directBackendClient.post('/api/v1/inquiry-data/query')",
          status: "deprecated",
          note: "This proxy route will be removed in a future version",
        },
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  console.warn(
    "[DEPRECATED] /api/inquiry-data/query is deprecated. " +
      "Please use directBackendClient to call /api/v1/inquiry-data/query directly.",
  );

  try {
    const cookie = request.headers.get("cookie") || "";
    const resp = await fetch(backendPath("/inquiry-data/query"), {
      method: "GET",
      headers: {
        cookie: cookie || "",
        "X-Deprecation-Warning":
          "This route is deprecated. Use direct backend calls instead.",
      },
      cache: "no-store",
    });

    const { proxyJsonOrNoContent } = await import("@/lib/route-helpers");
    const response = await proxyJsonOrNoContent(resp);

    // Add deprecation warning to response headers if possible
    if (response instanceof NextResponse) {
      response.headers.set(
        "X-Deprecation-Warning",
        "This route is deprecated. Use direct backend calls instead.",
      );
    }

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Proxy error",
        deprecation: {
          route: "/api/inquiry-data/query",
          alternative:
            "Use directBackendClient.get('/api/v1/inquiry-data/query')",
          status: "deprecated",
          note: "This proxy route will be removed in a future version",
        },
      },
      { status: 500 },
    );
  }
}
