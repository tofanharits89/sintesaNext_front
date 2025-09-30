"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useSessionInvalidation() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/verify', {
          method: 'GET',
          credentials: 'include',
        });
        
        if (!response.ok) {
          // Session invalidated -> clear httpOnly cookies via local API (clears on current origin) then redirect
          try {
            await fetch('/api/auth/logout', {
              method: 'POST',
              credentials: 'include',
            });
          } catch {}
          router.push('/login');
        }
      } catch {
        // Network error, ignore
      }
    };

    // Check session every 30 seconds
    const interval = setInterval(checkSession, 30000);
    
    return () => clearInterval(interval);
  }, [router]);
}