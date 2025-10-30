"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LoginLoading } from "@/components/ui/login-loading";

interface LogoutGuardProps {
  children: React.ReactNode;
}

/**
 * LogoutGuard Component
 * Simplified version - React Query handles cache clearing automatically
 * This component mainly prevents content flash during logout transitions
 */
export function LogoutGuard({ children }: LogoutGuardProps) {
  const { isAuthenticated, isLoggingOut } = useAuth();

  // Clear logout flags automatically
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;

      // Always clear logout flag on login page
      if (path === '/login') {
        sessionStorage.removeItem('sintesa_logout_in_progress');
        return;
      }

      // Clear logout flag if user is authenticated (logged in successfully)
      if (isAuthenticated) {
        sessionStorage.removeItem('sintesa_logout_in_progress');
        return;
      }

      // Fallback: if overlay persists too long, clear after 30 seconds
      const logoutInProgress = sessionStorage.getItem('sintesa_logout_in_progress');
      if (logoutInProgress) {
        const timestamp = parseInt(logoutInProgress, 10);
        const age = Date.now() - timestamp;
        if (age > 30000) { // 30 seconds
          sessionStorage.removeItem('sintesa_logout_in_progress');
        }
      }
    }
  }, [isAuthenticated]);

  // Show loading overlay during logout
  if (isLoggingOut) {
    return <LoginLoading isVisible={true} context="logout" />;
  }

  // Otherwise render children normally
  return <>{children}</>;
}

export default LogoutGuard;
