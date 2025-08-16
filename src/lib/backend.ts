export const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:88/api/v1";

export function backendPath(path: string) {
  if (!path.startsWith("/")) path = `/${path}`;
  return `${BACKEND_BASE_URL}${path}`;
}
