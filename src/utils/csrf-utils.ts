"use client";

/**
 * Utility function to extract CSRF token from cookies
 * Used for direct fetch calls that don't use the httpClient
 */
export function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  
  const value = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("XSRF-TOKEN="));
    
  if (!value) return null;
  
  return decodeURIComponent(value.split("=")[1] || "");
}

/**
 * Add CSRF token to headers if available
 * @param headers - Headers object to modify
 * @returns Modified headers with CSRF token if available
 */
export function addCsrfToHeaders(headers: HeadersInit): HeadersInit {
  const csrfToken = getCsrfToken();
  
  if (csrfToken) {
    return {
      ...headers,
      "X-CSRF-Token": csrfToken,
    };
  }
  
  return headers;
}
