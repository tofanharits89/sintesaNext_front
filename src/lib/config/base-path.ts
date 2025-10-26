// Base path disabled for simplicity: always use /api
export const BASE_PATH = "";

export function withBasePath(path: string) {
  // Always return path as-is (no extra prefix)
  if (!path.startsWith("/")) return `/${path}`;
  return path;
}

export function apiPath(path: string) {
  // ensure it starts with /api/v1
  let p = path;
  if (!p.startsWith("/api")) {
    p = `/api/v1${p}`;
  } else if (!p.startsWith("/api/v1")) {
    // If it starts with /api but not /api/v1, prepend v1
    p = `/api/v1${p.substring(4)}`;
  }
  return withBasePath(p);
}

// Helper function to create full API URLs for fetch calls
export function createApiUrl(path: string, origin = window.location.origin) {
  const apiPathWithBase = apiPath(path);
  return new URL(apiPathWithBase, origin);
}
