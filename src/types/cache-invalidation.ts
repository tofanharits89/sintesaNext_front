/**
 * Types for cache invalidation API
 */

export interface CacheInvalidationRequest {
  sessionKey: string;
  userId?: string;
  type: 'logout' | 'session_expired' | 'user_disabled';
  timestamp?: string;
}

export interface CacheInvalidationResponse {
  success: boolean;
  message: string;
  clearedKeys?: string[];
  timestamp: string;
}

export interface CacheInvalidationError {
  success: false;
  error: string;
  code: 'INVALID_REQUEST' | 'UNAUTHORIZED' | 'INTERNAL_ERROR' | 'INVALID_SIGNATURE';
  timestamp: string;
}