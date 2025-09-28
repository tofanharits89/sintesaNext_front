export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function withBasePath(path: string) {
  // If no base path, return the path as-is
  if (!BASE_PATH) return path;
  if (!path.startsWith("/")) return `${BASE_PATH}/${path}`;
  return `${BASE_PATH}${path}`;
}

export function apiPath(path: string) {
  // ensure it starts with /api
  const p = path.startsWith("/api") ? path : `/api${path}`;
  return withBasePath(p);
}

// Helper function to create full API URLs for fetch calls
export function createApiUrl(path: string, origin = window.location.origin) {
  const apiPathWithBase = apiPath(path);
  return new URL(apiPathWithBase, origin);
}
