"use client";

import { useSessionValidator } from '@/hooks/useSessionValidator';
import GlobalAuthCheck from './GlobalAuthCheck';
import { useEffect } from 'react';

/**
 * Session monitoring component
 * Combines GlobalAuthCheck with periodic session validation
 *
 * Re-enabled periodic validation to detect session invalidation
 * when Socket.IO events don't reach the browser or when socket is disconnected
 */
export default function SessionMonitor() {
  // Enable periodic validation (checks every 30 seconds by default)
  useSessionValidator();

  // Add window focus listener as additional safety net
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // User returned to the tab, validate session immediately
        fetch('/api/v1/auth/session/validate', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        }).then(response => {
          if (!response.ok) {
            console.log('[SessionMonitor] Session invalid on focus, redirecting to login');
            window.location.href = '/login?reason=session_expired';
          }
        }).catch(() => {
          // Network error, ignore - periodic validator will catch it
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return <GlobalAuthCheck />;
}
