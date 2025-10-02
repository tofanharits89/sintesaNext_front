/**
 * Centralized Cookie Clearing Utility
 *
 * Simplifies and standardizes cookie clearing across the application
 * Eliminates the complex nested loops and duplication
 */

import { logger } from "@/lib/utils";

export interface CookieConfig {
  name: string;
  httpOnly?: boolean;
  domain?: string;
  path?: string;
  sameSite?: "strict" | "lax" | "none";
}

export interface CookieClearingOptions {
  domains: string[];
  paths: string[];
  sameSiteValues: ("strict" | "lax" | "none")[];
}

/**
 * Cookie Clearing Manager
 *
 * Provides a simplified, reliable way to clear cookies
 */
export class CookieClearingManager {
  private static instance: CookieClearingManager;

  private constructor() {}

  public static getInstance(): CookieClearingManager {
    if (!CookieClearingManager.instance) {
      CookieClearingManager.instance = new CookieClearingManager();
    }
    return CookieClearingManager.instance;
  }

  /**
   * Get comprehensive cookie clearing options
   * Automatically determines the optimal clearing strategy
   */
  public getClearingOptions(): CookieClearingOptions {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    const domains = this.generateDomainVariants(hostname);
    const paths = ['/', '/api', '/auth', '/v3', ''];
    const sameSiteValues: ("strict" | "lax" | "none")[] = ['lax', 'strict']; // Most common values

    return {
      domains,
      paths,
      sameSiteValues
    };
  }

  /**
   * Generate domain variants for comprehensive clearing
   */
  private generateDomainVariants(hostname: string): string[] {
    const domains = new Set<string>();

    if (!hostname) {
      return [''];
    }

    // Add the exact hostname
    domains.add(hostname);

    // If hostname has subdomains, add the base domain
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      const baseDomain = parts.slice(-2).join('.');
      domains.add(baseDomain);
      domains.add(`.${baseDomain}`);
    }

    // Add environment-specific domains
    const cookieDomain = process.env.COOKIE_DOMAIN;
    if (cookieDomain) {
      domains.add(cookieDomain);
      if (!cookieDomain.startsWith('.')) {
        domains.add(`.${cookieDomain}`);
      }
    }

    // Add localhost for development
    if (hostname === 'localhost') {
      domains.add('localhost');
    }

    return Array.from(domains);
  }

  /**
   * Clear a single cookie with comprehensive options
   */
  public clearCookie(cookieName: string, options: Partial<CookieClearingOptions> = {}): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const clearingOptions = { ...this.getClearingOptions(), ...options };
    const domains = options.domains || clearingOptions.domains;
    const paths = options.paths || clearingOptions.paths;
    const sameSiteValues = options.sameSiteValues || clearingOptions.sameSiteValues;

    const pastDate = new Date(0);
    const baseAttributes = `expires=${pastDate.toUTCString()}; path=/`;

    logger.debug('[Cookie Manager] Clearing cookie:', {
      name: cookieName,
      domains: domains.length,
      paths: paths.length,
      sameSiteValues: sameSiteValues.length
    });

    // Clear cookie with all combinations
    for (const domain of domains) {
      for (const path of paths) {
        for (const sameSite of sameSiteValues) {
          const domainAttr = domain ? `; domain=${domain}` : '';
          const pathAttr = path ? `; path=${path}` : '';
          const sameSiteAttr = `; sameSite=${sameSite}`;

          const cookieString = `${cookieName}=; ${baseAttributes}${domainAttr}${pathAttr}${sameSiteAttr}`;
          document.cookie = cookieString;
        }

        // Also clear without sameSite attribute
        const domainAttr = domain ? `; domain=${domain}` : '';
        const pathAttr = path ? `; path=${path}` : '';
        const cookieString = `${cookieName}=; ${baseAttributes}${domainAttr}${pathAttr}`;
        document.cookie = cookieString;
      }
    }
  }

  /**
   * Clear multiple cookies efficiently
   */
  public clearCookies(cookieNames: string[], options: Partial<CookieClearingOptions> = {}): void {
    logger.debug('[Cookie Manager] Clearing multiple cookies:', {
      count: cookieNames.length,
      options
    });

    for (const cookieName of cookieNames) {
      this.clearCookie(cookieName, options);
    }
  }

  /**
   * Clear all authentication-related cookies
   */
  public clearAuthCookies(): void {
    const authCookieNames = [
      // Primary cookies
      'accessToken',
      'refreshToken',

      // Legacy variants
      'access_token',
      'refresh_token',
      'authToken',
      'auth_token',
      'token',

      // State and user cookies
      'authState',
      'auth_user',
      'socket_token',

      // Security cookies
      'XSRF-TOKEN',
      'csrfToken',

      // Additional common names
      'jwt',
      'authorization',
      'session'
    ];

    this.clearCookies(authCookieNames);

    logger.info('[Cookie Manager] Auth cookies cleared:', {
      count: authCookieNames.length
    });
  }

  /**
   * Verify cookies are cleared
   */
  public verifyCookiesCleared(cookieNames: string[]): { cleared: string[]; remaining: string[] } {
    const remaining: string[] = [];
    const cleared: string[] = [];

    if (typeof document === 'undefined') {
      return { cleared: [], remaining: cookieNames };
    }

    const currentCookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [name] = cookie.trim().split('=');
      if (name) acc.add(name);
      return acc;
    }, new Set<string>());

    for (const cookieName of cookieNames) {
      if (currentCookies.has(cookieName)) {
        remaining.push(cookieName);
      } else {
        cleared.push(cookieName);
      }
    }

    logger.debug('[Cookie Manager] Cookie verification:', {
      total: cookieNames.length,
      cleared: cleared.length,
      remaining: remaining.length
    });

    return { cleared, remaining };
  }

  /**
   * Get current cookie names
   */
  public getCurrentCookieNames(): string[] {
    if (typeof document === 'undefined') {
      return [];
    }

    return document.cookie.split(';')
      .map(cookie => cookie.trim().split('=')[0])
      .filter((name): name is string => !!name && name.length > 0);
  }

  /**
   * Force clear all cookies (emergency function)
   */
  public forceClearAllCookies(): void {
    const allCookieNames = this.getCurrentCookieNames();

    logger.warn('[Cookie Manager] Force clearing all cookies:', {
      count: allCookieNames.length
    });

    this.clearCookies(allCookieNames, {
      domains: this.generateDomainVariants(window.location.hostname),
      paths: ['/', '/api', '/auth', '/v3', '', '/app', '/static'],
      sameSiteValues: ['strict', 'lax', 'none']
    });
  }
}

// Export singleton instance
export const cookieClearingManager = CookieClearingManager.getInstance();

/**
 * Convenience functions for backward compatibility
 */
export function clearAuthCookies(): void {
  cookieClearingManager.clearAuthCookies();
}

export function clearCookies(cookieNames: string[], options?: Partial<CookieClearingOptions>): void {
  cookieClearingManager.clearCookies(cookieNames, options);
}

export function verifyCookiesCleared(cookieNames: string[]): { cleared: string[]; remaining: string[] } {
  return cookieClearingManager.verifyCookiesCleared(cookieNames);
}

export function forceClearAllCookies(): void {
  cookieClearingManager.forceClearAllCookies();
}