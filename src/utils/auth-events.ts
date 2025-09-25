"use client";

/**
 * Authentication event utilities for coordinating auth state across components
 */

import logger from "@/lib/logger";

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  email?: string;
  role: string;
  [key: string]: any;
}

export interface AuthLoginEventDetail {
  user: AuthUser;
  accessToken: string;
  timestamp: string;
}

export interface AuthLogoutEventDetail {
  reason?: string;
  timestamp: string;
}

export interface SocketAuthRequiredEventDetail {
  reason: string;
  action: string;
  timestamp: string;
}

/**
 * Dispatch login success event
 * Call this after successful login to notify all components
 */
export function dispatchLoginSuccess(user: AuthUser, accessToken: string) {
  if (typeof window === 'undefined') return;
  
  const event = new CustomEvent('auth:login', {
    detail: {
      user,
      accessToken,
      timestamp: new Date().toISOString()
    } as AuthLoginEventDetail
  });
  
  window.dispatchEvent(event);
  
  // Also dispatch a generic auth state change event
  window.dispatchEvent(new CustomEvent('auth:state-change', {
    detail: { authenticated: true, user }
  }));
}

/**
 * Dispatch logout event
 * Call this after logout to notify all components
 */
export function dispatchLogout(reason?: string) {
  if (typeof window === 'undefined') return;
  
  const event = new CustomEvent('auth:logout', {
    detail: {
      reason,
      timestamp: new Date().toISOString()
    } as AuthLogoutEventDetail
  });
  
  window.dispatchEvent(event);
  
  // Also dispatch a generic auth state change event
  window.dispatchEvent(new CustomEvent('auth:state-change', {
    detail: { authenticated: false, user: null }
  }));
}

/**
 * Listen for socket authentication required events
 * Use this to show login prompts when socket connection fails due to auth
 */
export function onSocketAuthRequired(callback: (detail: SocketAuthRequiredEventDetail) => void) {
  if (typeof window === 'undefined') return () => {};
  
  const handler = (event: CustomEvent<SocketAuthRequiredEventDetail>) => {
    callback(event.detail);
  };
  
  window.addEventListener('socket:auth-required', handler as EventListener);
  
  return () => {
    window.removeEventListener('socket:auth-required', handler as EventListener);
  };
}

/**
 * Listen for auth state changes
 */
export function onAuthStateChange(callback: (authenticated: boolean, user?: AuthUser | null) => void) {
  if (typeof window === 'undefined') return () => {};
  
  const handler = (event: CustomEvent<{ authenticated: boolean; user?: AuthUser | null }>) => {
    callback(event.detail.authenticated, event.detail.user);
  };
  
  window.addEventListener('auth:state-change', handler as EventListener);
  
  return () => {
    window.removeEventListener('auth:state-change', handler as EventListener);
  };
}

/**
 * Clear all auth-related data from cookies and localStorage
 * Use this during logout
 */
export function clearAuthData() {
  if (typeof document === 'undefined') return;
  
  // Clear auth cookies
  const authCookieNames = ['authState', 'accessToken', 'access_token', 'authToken', 'auth_token', 'token', 'refreshToken', 'refresh_token'];
  
  authCookieNames.forEach(cookieName => {
    // Clear cookie by setting it to expire in the past
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
  });
  
  // Clear localStorage items that might contain auth data
  const authStorageKeys = ['user', 'auth', 'token', 'accessToken', 'refreshToken'];
  
  authStorageKeys.forEach(key => {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch (error) {
      // Ignore errors if storage is not available
    }
  });
}

/**
 * Check if user is currently authenticated
 * This is a synchronous version of the useAuthCheck hook
 */
export function isAuthenticated(): boolean {
  if (typeof document === 'undefined') return false;
  
  const cookieString = document.cookie || '';
  if (!cookieString.trim()) return false;
  
  const cookies = cookieString.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    if (key && value) acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
  
  // First check for the authState cookie (non-httpOnly, readable by JavaScript)
  if (cookies.authState && typeof cookies.authState === 'string' && cookies.authState.trim()) {
    const parts = cookies.authState.split('.');
    if (parts.length === 3) {
      try {
        const payload = JSON.parse(atob(parts[1]));
        if (payload.exp && payload.exp * 1000 > Date.now()) {
          return true;
        }
      } catch (decodeError) {
        // Continue to fallback options if authState is invalid
      }
    }
  }
  
  // Fallback: check other cookie names
  const authCookieNames = ['accessToken', 'access_token', 'authToken', 'auth_token', 'token'];
  
  return authCookieNames.some(cookieName => {
    const token = cookies[cookieName];
    if (!token || typeof token !== 'string') return false;
    
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    try {
      const payload = JSON.parse(atob(parts[1]));
      return !payload.exp || payload.exp * 1000 > Date.now();
    } catch (error) {
      logger.debug("Failed to parse JWT token", error);
      return false;
    }
  });
}