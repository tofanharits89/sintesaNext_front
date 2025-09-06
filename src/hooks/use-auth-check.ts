"use client";

import { useState, useEffect } from "react";
import { parse } from "cookie";

/**
 * Hook to check if user is authenticated by looking for auth tokens in cookies
 * @returns boolean indicating if user is authenticated
 */
export function useAuthCheck() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = () => {
    if (typeof document === "undefined") {
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    const cookieString = document.cookie || "";
    if (!cookieString.trim()) {
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    // In cookie-only mode, httpOnly cookies won't be visible. Use a best-effort hint: any visible cookie implies session likely exists.
    const hasAnyVisibleCookie = Object.keys(parse(cookieString)).length > 0;
    setIsAuthenticated(hasAnyVisibleCookie);
    setIsLoading(false);
  };

  useEffect(() => {
    checkAuth();

    // Listen for auth-related events
    const handleAuthLogin = () => {
      setTimeout(checkAuth, 100); // Small delay to ensure cookies are set
    };

    const handleAuthLogout = () => {
      setIsAuthenticated(false);
    };

    const handleSocketAuthRequired = () => {
      setIsAuthenticated(false);
    };

    // Listen for custom auth events
    window.addEventListener("auth:login", handleAuthLogin);
    window.addEventListener("auth:logout", handleAuthLogout);
    window.addEventListener("socket:auth-required", handleSocketAuthRequired);

    // Also listen for storage events in case auth state changes in another tab
    window.addEventListener("storage", checkAuth);

    // Check auth state periodically (every 30 seconds)
    const interval = setInterval(checkAuth, 30000);

    return () => {
      window.removeEventListener("auth:login", handleAuthLogin);
      window.removeEventListener("auth:logout", handleAuthLogout);
      window.removeEventListener(
        "socket:auth-required",
        handleSocketAuthRequired
      );
      window.removeEventListener("storage", checkAuth);
      clearInterval(interval);
    };
  }, []);

  return { isAuthenticated, isLoading };
}

/**
 * Hook to get current auth token from cookies
 * @returns string | null - the auth token or null if not found
 */
export function useAuthToken() {
  const [token, setToken] = useState<string | null>(null);

  const getToken = () => {
    if (typeof document === "undefined") {
      setToken(null);
      return;
    }

    const cookieString = document.cookie || "";
    if (!cookieString.trim()) {
      setToken(null);
      return;
    }

    // Cookie-only mode: no JS-visible auth token
    setToken(null);
  };

  useEffect(() => {
    getToken();

    const handleAuthChange = () => {
      setTimeout(getToken, 100);
    };

    window.addEventListener("auth:login", handleAuthChange);
    window.addEventListener("auth:logout", handleAuthChange);
    window.addEventListener("socket:auth-required", () => setToken(null));

    return () => {
      window.removeEventListener("auth:login", handleAuthChange);
      window.removeEventListener("auth:logout", handleAuthChange);
      window.removeEventListener("socket:auth-required", () => setToken(null));
    };
  }, []);

  return token;
}
