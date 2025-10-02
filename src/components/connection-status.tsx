"use client";

import { useSocket } from "@/hooks/useSocket";
import { AlertCircle, Wifi, WifiOff, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getAuthTokenFromCookie } from "@/utils/auth-utils";

export function ConnectionStatus() {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const isLoginPage = pathname?.startsWith("/login");

  // Don't rely on token check - if we're not on login page, assume we should show socket status
  // The useSocket hook will handle the actual authentication
  const shouldUseSocket = !isLoginPage;
  const { isConnected, connectionState, error, reconnect } = useSocket();
  const [showStatus, setShowStatus] = useState(false);

  // Prevent hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);



  // Listen for explicit connected events to force-hide immediately (extra safety)
  useEffect(() => {
    const onConnected = () => setShowStatus(false);
    const onState = (e: Event) => {
      const detail = (e as CustomEvent).detail as any;
      if (detail?.state === 'connected' || detail?.connected === true) {
        setShowStatus(false);
      }
    };
    window.addEventListener('socket:connected', onConnected as EventListener);
    window.addEventListener('socket:state', onState as EventListener);
    return () => {
      window.removeEventListener('socket:connected', onConnected as EventListener);
      window.removeEventListener('socket:state', onState as EventListener);
    };
  }, []);

  // Single effect to manage showStatus state
  useEffect(() => {
    // Always hide immediately when connected
    if (isConnected === true || connectionState === "connected") {
      setShowStatus(false);
      if (isClient) {
        sessionStorage.removeItem('just_logged_in');
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
      const isPostLogin = isClient && sessionStorage.getItem('just_logged_in') === 'true';
      const delay = isPostLogin ? 5000 : 3000;
      
      const timeout = setTimeout(() => {
        // Double-check state before showing
        // connectionState is narrowed to problematic states here, so simply rely on isConnected
        if (!isConnected) {
          setShowStatus(true);
        }
      }, delay);

      return () => {
        clearTimeout(timeout);
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
        if (error) {
          if (error.includes("Authentication")) {
            return "Authentication failed. Please refresh and log in again.";
          }
          if (error.includes("Failed to connect after login")) {
            return "Connecting after login...";
          }
          if (error.includes("Connection will retry automatically")) {
            return "Connection lost. Retrying automatically...";
          }
          return error;
        }
        return "Connection lost. Attempting to reconnect...";
      case "error":
        if (error && error.includes("Authentication")) {
          return "Authentication failed. Please refresh and log in again.";
        }
        return "Connection error. Please check your internet connection.";
      default:
        return "Connection status unknown";
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

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm">
      <Alert
        variant={getAlertVariant() as "default" | "destructive"}
        className="shadow-lg border-2"
      >
        {getStatusIcon()}
        <AlertDescription className="flex items-center justify-between">
          <span className="text-sm">{getStatusMessage()}</span>
          {(connectionState === "disconnected" ||
            connectionState === "error") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (error && error.includes("Authentication")) {
                  window.location.reload();
                } else {
                  reconnect();
                }
              }}
              className="ml-2 h-6 px-2 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              {error && error.includes("Authentication") ? "Refresh" : "Retry"}
            </Button>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}
