"use client";

import { useEffect } from "react";
import { useAuthSessionStore } from "@/stores/session-store";
import { LoginLoading } from "@/components/ui/login-loading";

interface LogoutGuardProps {
  children: React.ReactNode;
}

/**
 * LogoutGuard Component
 * Prevents any content flash during logout by showing loading overlay
 * when logout is in progress
 */
export function LogoutGuard({ children }: LogoutGuardProps) {
  const isLogoutInProgress = useAuthSessionStore((state) => state.isLogoutInProgress);
  const isAuthenticated = useAuthSessionStore((state) => state.isAuthenticated);

  // Clear logout in progress flag automatically
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      
      // Always clear logout flag on login page
      if (path === '/login') {
        useAuthSessionStore.getState().setLogoutInProgress(false);
        sessionStorage.removeItem('sintesa_logout_in_progress');
        return;
      }

      // Clear logout flag if user is authenticated (logged in successfully)
      if (isAuthenticated) {
        useAuthSessionStore.getState().setLogoutInProgress(false);
        sessionStorage.removeItem('sintesa_logout_in_progress');
        return;
      }

      // If logout flag exists and we're not on login page or authenticated, 
      // it might be stale - clear it after 5 seconds
      const logoutInProgress = sessionStorage.getItem('sintesa_logout_in_progress');
      if (logoutInProgress) {
        const timestamp = parseInt(logoutInProgress, 10);
        const age = Date.now() - timestamp;
        if (age > 5000) { // 5 seconds
          useAuthSessionStore.getState().setLogoutInProgress(false);
          sessionStorage.removeItem('sintesa_logout_in_progress');
        }
      }
    }
  }, [isLogoutInProgress, isAuthenticated]);

  // If logout is in progress, only show loading overlay
  if (isLogoutInProgress) {
    return <LoginLoading isVisible={true} context="logout" />;
  }

  // Otherwise render children normally
  return <>{children}</>;
}

export default LogoutGuard;
