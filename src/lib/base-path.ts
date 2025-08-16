export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "/v3/next";

export function withBasePath(path: string) {
  if (!path.startsWith("/")) return `${BASE_PATH}/${path}`;
  return `${BASE_PATH}${path}`;
}

export function apiPath(path: string) {
  // ensure it starts with /api
  const p = path.startsWith("/api") ? path : `/api${path}`;
  return withBasePath(p);
}
