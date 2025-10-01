"use client";

import { createContext, useContext, useEffect } from "react";

import { useAuth } from "@/hooks/useAuth";
import { useSessionInvalidation } from "@/hooks/useSessionInvalidation";
// Removed client-side redirects - middleware is authoritative

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user?: any;
  logout: () => void;
  logoutAsync: () => Promise<void>;
  isLoggingOut: boolean;
  refetch: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Comprehensive auth provider that handles:
 * - Authentication state management
 * - Automatic redirects on session expiration
 * - Real-time session monitoring via WebSocket
 * - Cache invalidation on logout
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth();
  
  // Monitor for session invalidation from other devices
  useSessionInvalidation();
  
  // No client-side redirects - middleware handles all auth

  const contextValue: AuthContextType = {
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    user: auth.user,
    logout: auth.logout,
    logoutAsync: auth.logoutAsync,
    isLoggingOut: auth.isLoggingOut,
    refetch: auth.refetch,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use the auth context
 */
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}