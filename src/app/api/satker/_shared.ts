import type { NextRequest } from "next/server";

// Deprecated: no longer used in cookie-only flow. Keeping stub to avoid import errors.
export function getToken(_req: NextRequest): string | null {
  return null;
}
