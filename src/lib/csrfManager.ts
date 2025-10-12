/**
 * Unified CSRF Management for Frontend
 * 
 * Handles CSRF token fetching, caching, and attachment to requests
 * Fixes synchronization issues between frontend and backend
 */

import { apiPath } from './base-path';

interface CSRFCacheEntry {
  token: string;
  expiresAt: number;
}

class CSRFManager {
  private static instance: CSRFManager;
  private cache: Map<string, CSRFCacheEntry> = new Map();
  private refreshPromise: Promise<string> | null = null;
  
  private constructor() {}
  
  static getInstance(): CSRFManager {
    if (!CSRFManager.instance) {
      CSRFManager.instance = new CSRFManager();
    }
    return CSRFManager.instance;
  }
  
  /**
   * Get current CSRF token from cache or fetch new one
   */
  async getCSRFToken(): Promise<string> {
    const cached = this.getCachedToken();
    if (cached) {
      return cached;
    }
    
    return this.refreshToken();
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
   * Cache token with expiration
   */
  private cacheToken(token: string, expiresInSeconds?: number): void {
    const ttlMs =
      typeof expiresInSeconds === 'number' && expiresInSeconds > 0
        ? expiresInSeconds * 1000
        : 8 * 60 * 60 * 1000;
    const expiresAt = Date.now() + ttlMs;
    this.cache.set('default', { token, expiresAt });
  }
  
  /**
   * Fetch new token from backend
   */
  private async fetchToken(): Promise<{ token: string; expiresIn?: number }> {
    const response = await fetch(apiPath('/csrf-token'), {
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
    
    if (!data.success || !data.token) {
      throw new Error('Invalid CSRF token response');
    }
    
    console.log('[CSRF] Token fetched successfully', {
      tokenLength: data.token.length,
      expiresIn: data.expiresIn
    });
    
    return { token: data.token, expiresIn: data.expiresIn };
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
