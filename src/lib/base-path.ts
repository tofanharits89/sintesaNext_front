// Base path disabled for simplicity: always use /api
export const BASE_PATH = "";

export function withBasePath(path: string) {
  // Always return path as-is (no extra prefix)
  if (!path.startsWith("/")) return `/${path}`;
  return path;
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
