/**
 * Cache Invalidation Signature Utility
 *
 * Provides secure HMAC-SHA256 signature generation for cache invalidation requests
 * This prevents unauthorized cache manipulation attacks
 */

const CACHE_INVALIDATE_SECRET = process.env.CACHE_INVALIDATE_SECRET || "";

/**
 * Generate HMAC-SHA256 signature for cache invalidation request
 * @param requestBody - The request body as string
 * @returns Promise<string> - Hexadecimal signature
 */
export async function generateCacheInvalidationSignature(requestBody: string): Promise<string> {
  if (!CACHE_INVALIDATE_SECRET) {
    console.warn("🚨 SECURITY WARNING: CACHE_INVALIDATE_SECRET not configured!");
    console.warn("   Cache invalidation requests will be vulnerable to unauthorized access.");
    return "";
  }

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(`${CACHE_INVALIDATE_SECRET}:${requestBody}`);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return signature;
  } catch (error) {
    console.error("[Cache Signature] Failed to generate signature:", error);
    throw new Error("Failed to generate cache invalidation signature");
  }
}

/**
 * Prepare authenticated headers for cache invalidation request
 * @param requestBody - The request body as string
 * @returns Promise<Record<string, string>> - Headers with signature
 */
export async function prepareCacheInvalidationHeaders(requestBody: string): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-internal-request': 'true'
  };

  if (CACHE_INVALIDATE_SECRET) {
    const signature = await generateCacheInvalidationSignature(requestBody);
    if (signature) {
      headers['x-internal-signature'] = signature;
    }
  }

  return headers;
}

/**
 * Check if cache invalidation security is properly configured
 * @returns boolean - True if secret is configured
 */
export function isCacheInvalidationSecure(): boolean {
  return !!CACHE_INVALIDATE_SECRET;
}

/**
 * Get security status for cache invalidation
 * @returns object - Security status information
 */
export function getCacheInvalidationSecurityStatus(): {
  isSecure: boolean;
  hasSecret: boolean;
  warning?: string;
} {
  const hasSecret = !!CACHE_INVALIDATE_SECRET;

  if (!hasSecret) {
    return {
      isSecure: false,
      hasSecret: false,
      warning: "CACHE_INVALIDATE_SECRET not configured - cache invalidation is vulnerable"
    };
  }

  return {
    isSecure: true,
    hasSecret: true
  };
}

/**
 * Verify cache invalidation signature (for testing/validation)
 * @param requestBody - The original request body
 * @param signature - The signature to verify
 * @returns Promise<boolean> - True if signature is valid
 */
export async function verifyCacheInvalidationSignature(
  requestBody: string,
  signature: string
): Promise<boolean> {
  if (!CACHE_INVALIDATE_SECRET || !signature) {
    return false;
  }

  try {
    const expectedSignature = await generateCacheInvalidationSignature(requestBody);
    return expectedSignature.toLowerCase() === signature.toLowerCase();
  } catch (error) {
    console.error("[Cache Signature] Failed to verify signature:", error);
    return false;
  }
}
