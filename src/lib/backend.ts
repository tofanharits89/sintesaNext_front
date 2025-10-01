// Use server-side URL when running on server, client-side URL when running in browser
export const BACKEND_BASE_URL = typeof window === 'undefined' 
  ? (process.env.BACKEND_URL || process.env.API_URL || "http://backend:88/api/v1")
  : (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:88/api/v1");

export function backendPath(path: string) {
  if (!path.startsWith("/")) path = `/${path}`;
  return `${BACKEND_BASE_URL}${path}`;
}
