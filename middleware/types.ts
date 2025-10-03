/**
 * Type definitions for middleware
 */

export interface CacheEntry {
  ok: boolean;
  exp: number;
  created?: number;
  reason?: string;
}

export interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface CacheInvalidationRequest {
  sessionKey: string;
  tokenHash?: string;
  type?: string;
  userId?: string;
}

export interface CacheInvalidationResponse {
  success: boolean;
  message?: string;
  error?: string;
  code?: string;
  clearedKeys?: string[];
  timestamp: string;
}

export type CircuitBreakerState = 'CLOSED' | 'OPEN';
