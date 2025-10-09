"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string | undefined;
}

/**
 * Component that protects routes and automatically redirects when session expires
 */
export function AuthGuard({ 
  children, 
  fallback = <div>Loading...</div>,
  redirectTo = "/login" 
}: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useUnifiedAuth();
  const { isRedirecting } = useAuthRedirect({ redirectTo });

  // Show loading state while checking auth
  if (isLoading || isRedirecting) {
    return <>{fallback}</>;
  }

  // Show children only if authenticated
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // This should rarely be reached due to useAuthRedirect, but provides fallback
  return <>{fallback}</>;
}

/**
 * Higher-order component version of AuthGuard
 */
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  options?: { redirectTo?: string; fallback?: React.ReactNode }
) {
  return function AuthGuardedComponent(props: P) {
    return (
      <AuthGuard redirectTo={options?.redirectTo} fallback={options?.fallback}>
        <Component {...props} />
      </AuthGuard>
    );
  };
}