/**
 * Token Utilities
 * Helper functions for token extraction and validation
 */

const HEX_HASH_REGEX = /^[a-f0-9]{64}$/i;

export class TokenUtils {
  static isHexHash(value: unknown): value is string {
    return typeof value === "string" && HEX_HASH_REGEX.test(value);
  }

  static async computeSha256Hex(value: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(value);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  static extractAccessTokenValue(cacheKey: string): string | null {
    if (!cacheKey) return null;
    const marker = "accessToken=";
    const markerIndex = cacheKey.indexOf(marker);
    if (markerIndex === -1) return null;

    let tokenValue = cacheKey.slice(markerIndex + marker.length);
    const delimiterIndex = tokenValue.indexOf(";");
    if (delimiterIndex !== -1) {
      tokenValue = tokenValue.slice(0, delimiterIndex);
    }

    try {
      return decodeURIComponent(tokenValue);
    } catch {
      return tokenValue;
    }
  }

  /**
   * Extract cookie age from JWT token (time since issued)
   */
  static extractCookieAge(cookieString: string): number | null {
    try {
      const tokenValue = this.extractAccessTokenValue(cookieString);
      if (!tokenValue) return null;
      
      const parts = tokenValue.split('.');
      if (parts.length !== 3 || !parts[1]) return null;
      
      const payload = JSON.parse(atob(parts[1]));
      if (!payload.iat) return null;
      
      const issuedAt = payload.iat * 1000;
      const age = Date.now() - issuedAt;
      
      return age;
    } catch {
      return null;
    }
  }

  /**
   * Extract access token from cookie string with validation
   */
  static extractAccessToken(cookieStr: string): string | null {
    if (!cookieStr) return null;
    const match = cookieStr.match(/(?:^|;\s*)accessToken=([^;]+)/);
    if (!match || !match[1]) return null;
    const value = match[1].trim();
    
    // Treat empty, 'deleted', 'null', 'undefined' as no token
    if (!value || value === 'deleted' || value === 'null' || value === 'undefined' || value.length < 10) {
      return null;
    }
    return value;
  }
}
