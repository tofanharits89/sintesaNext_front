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
  
  // Verify token is valid
  fetch('/api/auth/verify', {
    method: 'GET',
    credentials: 'include',
  })
  .then(response => {
    if (!response.ok) {
      window.location.href = '/login';
    }
  })
  .catch(() => {
    window.location.href = '/login';
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