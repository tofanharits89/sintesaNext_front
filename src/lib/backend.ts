// Dynamic backend URL based on current host (for office network deployments)
function getBackendUrl(): string {
  // Server-side: use Docker internal hostname or env var
  if (typeof window === 'undefined') {
    const serverUrl = (
      process.env.BACKEND_URL ||
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      "http://localhost:88/api/v1"
    );
    console.log('[Backend] Server-side URL:', serverUrl);
    return serverUrl;
  }
  
  // Client-side: use same host as frontend but port 88
  // This ensures cookies work from any IP in the office network
  const useEnvUrl = process.env.NEXT_PUBLIC_USE_STATIC_BACKEND_URL === 'true';
  
  if (useEnvUrl) {
    // Use static URL from env (for specific deployments)
    const staticUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:88/api/v1";
    console.log('[Backend] Using static URL:', staticUrl);
    return staticUrl;
  }
  
  // Dynamic URL: use current hostname with backend port
  const currentHost = window.location.hostname;
  const backendPort = process.env.NEXT_PUBLIC_BACKEND_PORT || '88';
  const dynamicUrl = `http://${currentHost}:${backendPort}/api/v1`;
  console.log('[Backend] Using dynamic URL:', dynamicUrl, 'from hostname:', currentHost);
  return dynamicUrl;
}

export const BACKEND_BASE_URL = getBackendUrl();

export function backendPath(path: string) {
  if (!path.startsWith("/")) path = `/${path}`;
  return `${BACKEND_BASE_URL}${path}`;
}
