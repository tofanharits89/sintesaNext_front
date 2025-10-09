/**
 * Simple cookie utilities for API routes
 * Handles cookie forwarding between frontend and backend API routes
 */

import type { NextRequest, NextResponse } from "next/server";

/**
 * Extract Set-Cookie headers from backend response and forward to client
 */
export function getSetCookieValues(response: Response): string[] {
  const setCookieHeader = response.headers.get("set-cookie");
  if (!setCookieHeader) return [];

  // Handle multiple Set-Cookie headers
  return setCookieHeader.split(",").map(cookie => cookie.trim());
}

/**
 * Forward Set-Cookie headers from backend response to Next.js response
 */
export function forwardSetCookies(
  backendResponse: Response,
  nextResponse: NextResponse
): NextResponse {
  const setCookieValues = getSetCookieValues(backendResponse);

  setCookieValues.forEach(cookieValue => {
    nextResponse.headers.append("set-cookie", cookieValue);
  });

  return nextResponse;
}

/**
 * Get all cookies from request for forwarding to backend
 */
export function getRequestCookies(request: NextRequest): Record<string, string> {
  const cookies: Record<string, string> = {};

  request.cookies.getAll().forEach(cookie => {
    if (cookie.name && cookie.value) {
      cookies[cookie.name] = cookie.value;
    }
  });

  return cookies;
}

/**
 * Create Cookie header for backend requests
 */
export function createCookieHeader(request: NextRequest): string {
  const cookies = getRequestCookies(request);
  return Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}