"use client";

import { useEffect } from "react";
import { useClientAuth } from "@/hooks/useClientAuth";
import { AuthSkeleton } from "@/components/layout/dashboard-skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface AuthLoadingProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showRetry?: boolean;
}

/**
 * Client-side auth loading wrapper with React Query integration
 * Provides smooth loading states and error handling for authenticated content
 */
export function AuthLoading({ 
  children, 
  fallback = <AuthSkeleton />,
  showRetry = true 
}: AuthLoadingProps) {
  const { 
    isAuthenticated, 
    isLoading, 
    isError, 
    error, 
    refreshAuth 
  } = useClientAuth({
    redirectOnFailure: true,
    redirectTo: "/login"
  });

  // Show loading state
  if (isLoading) {
    return <>{fallback}</>;
  }

  // Show error state with retry option
  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full space-y-4">
          <Alert variant="destructive">
            <AlertDescription>
              Authentication failed: {error?.message || "Unknown error"}
            </AlertDescription>
          </Alert>
          
          {showRetry && (
            <Button 
              onClick={() => refreshAuth()} 
              variant="outline" 
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Authentication
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Show content if authenticated
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Fallback to loading state
  return <>{fallback}</>;
}

/**
 * Lightweight auth status component for navigation
 */
export function AuthStatus({ 
  children, 
  fallback = null 
}: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useClientAuth({
    redirectOnFailure: false
  });

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

/**
 * Progressive enhancement wrapper for auth-dependent features
 * Shows basic content immediately, enhances with auth-specific features when ready
 */
export function ProgressiveAuth({
  children,
  basicContent,
  loadingContent = null
}: {
  children: React.ReactNode;
  basicContent: React.ReactNode;
  loadingContent?: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useClientAuth({
    redirectOnFailure: false
  });

  // Show basic content immediately
  if (isLoading) {
    return (
      <>
        {basicContent}
        {loadingContent}
      </>
    );
  }

  // Enhanced content for authenticated users
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Basic content for non-authenticated users
  return <>{basicContent}</>;
}