"use client";

/**
 * Simple auth redirect utility
 */
export function redirectToLoginIfNotAuth() {
  // Check if user has access token
  const hasToken = document.cookie.includes('accessToken=');
  
  if (!hasToken) {
    window.location.href = '/login';
    return;
  }
  
  // Verify session via /me; only redirect on 401/403
  fetch('/api/auth/me', {
    method: 'GET',
    credentials: 'include',
  })
  .then(response => {
    if (response.status === 401 || response.status === 403) {
      window.location.href = '/login';
    }
  })
  .catch(() => {
    // Network error: do not force logout; middleware protects pages anyway
  });
}

/**
 * Hook version for React components
 */
export function useAuthRedirectCheck() {
  if (typeof window !== 'undefined') {
    redirectToLoginIfNotAuth();
  }
}