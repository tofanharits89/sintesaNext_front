"use client";

import { useUnifiedSocket } from "@/hooks/useUnifiedSocket";
import { AlertCircle, Wifi, WifiOff, RotateCcw } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

export function ConnectionStatus() {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const isLoginPage = pathname?.startsWith("/login");

  // Don't rely on token check - if we're not on login page, assume we should show socket status
  // The useSocket hook will handle the actual authentication
  const shouldUseSocket = !isLoginPage;
  const { isConnected, connectionState, error, reconnect } = useUnifiedSocket();
  const [showStatus, setShowStatus] = useState(false);

  // Use ref to track timeout and prevent multiple timers
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Prevent hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Single consolidated effect to manage showStatus state
  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Always hide immediately when connected
    if (isConnected === true || connectionState === "connected") {
      setShowStatus(false);
      if (isClient && typeof window !== "undefined") {
        sessionStorage.removeItem("just_logged_in");
      }
      return;
    }

    // Don't show during connecting states
    if (connectionState === "connecting") {
      setShowStatus(false);
      return;
    }

    // Only show for problematic states after a delay
    if (connectionState === "disconnected" || connectionState === "error") {
      const isPostLogin =
        isClient &&
        typeof window !== "undefined" &&
        sessionStorage.getItem("just_logged_in") === "true";
      const delay = isPostLogin ? 5000 : 3000;

      timeoutRef.current = setTimeout(() => {
        // Double-check state before showing
        if (!isConnected) {
          setShowStatus(true);
        }
      }, delay);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };
    }

    // For any other state, hide
    setShowStatus(false);
  }, [isConnected, connectionState, isClient]);

  // Primary checks - don't show in these cases
  if (!shouldUseSocket || isLoginPage) {
    return null;
  }

  // CRITICAL: Don't show when connected (multiple checks for safety)
  if (isConnected === true || connectionState === "connected") {
    return null;
  }

  // Don't show during active connection attempts
  if (connectionState === "connecting") {
    return null;
  }

  // Don't show if we haven't waited long enough or if showStatus is explicitly false
  if (!showStatus) {
    return null;
  }

  const getStatusIcon = () => {
    switch (connectionState) {
      case "disconnected":
        return <WifiOff className="h-4 w-4" />;
      case "error":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusMessage = () => {
    switch (connectionState) {
      case "disconnected":
        return "Reconnecting...";
      case "error":
        return "Connection lost";
      default:
        return "Offline";
    }
  };

  const getAlertVariant = () => {
    switch (connectionState) {
      case "disconnected":
      case "error":
        return "destructive";
      default:
        return "default";
    }
  };

  const handleReconnect = () => {
    if (error && error.includes("Authentication")) {
      window.location.reload();
    } else {
      reconnect();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg flex items-center space-x-2 text-xs">
        {getStatusIcon()}
        <span>{getStatusMessage()}</span>
        {(connectionState === "disconnected" ||
          connectionState === "error") && (
          <button
            onClick={handleReconnect}
            className="ml-1 hover:text-gray-300 transition-colors"
            title={
              error && error.includes("Authentication")
                ? "Refresh page"
                : "Retry connection"
            }
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
