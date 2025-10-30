/**
 * Unified CSRF Management for Frontend
 * 
 * Handles CSRF token fetching, caching, and attachment to requests
 * Fixes synchronization issues between frontend and backend
 */

import { apiPath } from '../config/base-path';

interface CSRFCacheEntry {
  token: string;
  expiresAt: number;
}

class CSRFManager {
  private static instance: CSRFManager;
  private cache: Map<string, CSRFCacheEntry> = new Map();
  private refreshPromise: Promise<string> | null = null;
  private lockPromise: Promise<string> | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  // Allow friendly name for prime function without exposing cacheToken as public
  primeToken(token: string, expiresIn?: number | null): void {
    this.cacheToken(token, typeof expiresIn === "number" ? expiresIn : undefined);
  }

  private constructor() {
    // Cleanup timer on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        if (this.refreshTimer) {
          clearTimeout(this.refreshTimer);
        }
      });
    }
  }
  
  static getInstance(): CSRFManager {
    if (!CSRFManager.instance) {
      CSRFManager.instance = new CSRFManager();
    }
    return CSRFManager.instance;
  }
  
  /**
   * Get current CSRF token from cache or fetch new one
   * Implements lock mechanism to prevent race conditions on concurrent requests
   */
  async getCSRFToken(): Promise<string> {
    const cached = this.getCachedToken();
    if (cached) {
      return cached;
    }

    // If lock is already held, wait for it
    if (this.lockPromise) {
      return this.lockPromise;
    }

    // Acquire lock and fetch token
    this.lockPromise = this.doFetchToken();

    try {
      const token = await this.lockPromise;
      return token;
    } finally {
      this.lockPromise = null;
    }
  }

  /**
   * Internal method that actually fetches the token (protected by lock)
   */
  private async doFetchToken(): Promise<string> {
    const { token, expiresIn } = await this.fetchToken();
    this.cacheToken(token, expiresIn);
    return token;
  }
  
  /**
   * Force refresh CSRF token
   */
  async refreshToken(): Promise<string> {
    // If refresh is already in progress, return that promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }
    
    this.refreshPromise = (async () => {
      const { token, expiresIn } = await this.fetchToken();
      this.cacheToken(token, expiresIn);
      return token;
    })();

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }
  
  /**
   * Get token from cookies (fallback method)
   */
  getTokenFromCookie(): string | null {
    if (typeof document === 'undefined') return null;
    
    const getCookie = (name: string): string | null => {
      const value = document.cookie
        .split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith(`${encodeURIComponent(name)}=`));
      if (!value) return null;
      return decodeURIComponent(value.split('=')[1] || '');
    };
    
    return getCookie('XSRF-TOKEN');
  }
  
  /**
   * Attach CSRF token to request headers
   */
  async attachCSRFToken(headers: Record<string, string>): Promise<void> {
    const token = await this.getCSRFToken();
    if (token) {
      // Use the header name that backend expects
      headers['X-CSRF-Token'] = token;
      
      // Also add alternative headers for compatibility
      headers['x-csrf-token'] = token;
      headers['X-XSRF-TOKEN'] = token;
    }
  }
  
  /**
   * Clear cached token (useful after logout)
   */
  clearCache(): void {
    this.cache.clear();
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
  
  /**
   * Get cached token if not expired
   */
  private getCachedToken(): string | null {
    const entry = this.cache.get('default');
    if (!entry) {
      return null;
    }
    
    // Check if token is still valid (with 5-minute buffer)
    if (Date.now() > entry.expiresAt - 5 * 60 * 1000) {
      this.cache.delete('default');
      return null;
    }
    
    return entry.token;
  }
  
  /**
   * Cache token with expiration and schedule proactive refresh
   */
  private cacheToken(token: string, expiresInSeconds?: number): void {
    const ttlMs =
      typeof expiresInSeconds === 'number' && expiresInSeconds > 0
        ? expiresInSeconds * 1000
        : 8 * 60 * 60 * 1000;
    const expiresAt = Date.now() + ttlMs;
    this.cache.set('default', { token, expiresAt });

    // Schedule proactive refresh 5 minutes before expiration
    const refreshTime = expiresAt - (5 * 60 * 1000);
    const timeUntilRefresh = refreshTime - Date.now();

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    if (timeUntilRefresh > 0) {
      this.refreshTimer = setTimeout(async () => {
        console.log('[CSRF] Proactively refreshing token before expiration');
        try {
          await this.refreshToken();
        } catch (error) {
          console.error('[CSRF] Proactive refresh failed:', error);
          // Don't throw - let the next request trigger a fresh fetch
        }
      }, timeUntilRefresh);
    }
  }
  
  /**
   * Fetch new token from backend
   */
  private async fetchToken(): Promise<{ token: string; expiresIn?: number }> {
    const response = await fetch(apiPath('/auth/csrf'), {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`CSRF token fetch failed: ${response.status}`);
    }

    const data = await response.json();

    // Backend returns: { success: true, data: { csrfToken: "...", expiresIn: 28800 } }
    if (!data.success || !data.data?.csrfToken) {
      throw new Error('Invalid CSRF token response');
    }

    console.log('[CSRF] Token fetched successfully', {
      tokenLength: data.data.csrfToken.length,
      expiresIn: data.data.expiresIn
    });

    return { token: data.data.csrfToken, expiresIn: data.data.expiresIn };
  }
  
  /**
   * Validate token format
   */
  private isValidToken(token: string): boolean {
    // Basic validation: should be a hex string of reasonable length
    return /^[a-f0-9]{64}$/i.test(token);
  }
}

// Export singleton instance
export const csrfManager = CSRFManager.getInstance();

// Export convenience functions
export const getCSRFToken = () => csrfManager.getCSRFToken();
export const refreshToken = () => csrfManager.refreshToken();
export const attachCSRFToken = (headers: Record<string, string>) => csrfManager.attachCSRFToken(headers);
export const clearCSRFCache = () => csrfManager.clearCache();
export const getCSRFTokenFromCookie = () => csrfManager.getTokenFromCookie();
export const primeCSRFToken = (token: string, expiresIn?: number | null) =>
  csrfManager.primeToken(token, expiresIn);
