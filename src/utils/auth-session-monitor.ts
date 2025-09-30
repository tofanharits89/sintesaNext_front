/**
 * Simple session monitor that checks auth status periodically
 * and redirects to login when session expires
 */

let checkInterval: NodeJS.Timeout | null = null;
let isChecking = false;

export function startSessionMonitoring() {
  if (checkInterval) return;
  
  checkInterval = setInterval(async () => {
    if (isChecking) return;
    isChecking = true;
    
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        console.log('[SessionMonitor] Auth check failed, redirecting to login');
        window.location.href = '/login';
      }
    } catch (error) {
      console.log('[SessionMonitor] Auth check error, redirecting to login');
      window.location.href = '/login';
    } finally {
      isChecking = false;
    }
  }, 5000); // Check every 5 seconds
}

export function stopSessionMonitoring() {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
}