"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useSessionInvalidation() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
        });
        
        if (response.status === 401 || response.status === 403) {
          // Session invalidated -> rely on middleware; just navigate to login
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