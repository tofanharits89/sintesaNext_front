/**
 * Centralized Route Configuration
 * Single source of truth for route protection and visibility
 */

export const PROTECTED_ROUTES = [
  "/dashboard",
  "/inquiry-data",
  "/admin",
  "/profile",
  "/users",
  "/settings",
  "/messages",
  "/notifications",
  "/makan-bergizi",
  "/data-supplier",
  "/epa",
  "/log-user",
  "/monitor-performa",
  "/pengaturan",
  "/satker",
  "/transfer-daerah",
  "/tentang-kita",
] as const;

export const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/server-error",
  "/unauthorized",
  "/ip-blocked",
] as const;

/**
 * Check if a path matches any of the protected routes
 */
export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Check if a path matches any of the public routes
 */
export function isPublicRoute(pathname: string): boolean {
  if (pathname === "/") return true; // Home is public
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}
