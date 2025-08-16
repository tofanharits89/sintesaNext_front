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
  const isLoginPage = pathname?.startsWith("/login");
  const hasToken = !!getAuthTokenFromCookie();

  // Only use socket if not on login page and user has token
  const shouldUseSocket = !isLoginPage && hasToken;
  const { isConnected, connectionState, error, reconnect } = useSocket();
  const [showStatus, setShowStatus] = useState(false);

  // Only show status after a delay to avoid brief flashes during normal reconnection
  useEffect(() => {
    let timeout: NodeJS.Timeout | undefined;

    if (
      !isConnected &&
      (connectionState === "disconnected" || connectionState === "reconnecting")
    ) {
      // Only show if disconnected for more than 2 seconds to avoid showing during normal refresh
      timeout = setTimeout(() => {
        setShowStatus(true);
      }, 2000);
    } else if (isConnected && connectionState === "connected") {
      // Hide immediately when connected
      setShowStatus(false);
      if (timeout) clearTimeout(timeout);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isConnected, connectionState]);

  // Don't show on login page or when user has no token
  if (!shouldUseSocket) {
    return null;
  }

  // Don't show anything when connected or during brief connection states
  if (isConnected && connectionState === "connected") {
    return null;
  }

  // Don't show during brief initial connection states
  if (!showStatus) {
    return null;
  }

  const getStatusIcon = () => {
    switch (connectionState) {
      case "connecting":
        return <RotateCcw className="h-4 w-4 animate-spin" />;
      case "reconnecting":
        return <RotateCcw className="h-4 w-4 animate-spin" />;
      case "disconnected":
        return <WifiOff className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusMessage = () => {
    switch (connectionState) {
      case "connecting":
        return "Connecting to server...";
      case "reconnecting":
        return "Reconnecting...";
      case "disconnected":
        if (error) {
          if (error.includes("Authentication")) {
            return "Authentication failed. Please refresh and log in again.";
          }
          if (error.includes("Failed to reconnect after login")) {
            return "Connection lost after login. Please refresh the page.";
          }
          return error;
        }
        return "Connection lost. Attempting to reconnect...";
      case "auth_failed":
        return "Authentication failed. Please refresh and log in again.";
      case "error":
        return "Connection error. Please check your internet connection.";
      default:
        return "Connection status unknown";
    }
  };

  const getAlertVariant = () => {
    switch (connectionState) {
      case "connecting":
      case "reconnecting":
        return "default";
      case "disconnected":
      case "auth_failed":
      case "error":
        return "destructive";
      default:
        return "default";
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm">
      <Alert variant={getAlertVariant() as any} className="shadow-lg border-2">
        {getStatusIcon()}
        <AlertDescription className="flex items-center justify-between">
          <span className="text-sm">{getStatusMessage()}</span>
          {(connectionState === "disconnected" ||
            connectionState === "auth_failed" ||
            connectionState === "error") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (connectionState === "auth_failed") {
                  window.location.reload();
                } else {
                  reconnect();
                }
              }}
              className="ml-2 h-6 px-2 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              {connectionState === "auth_failed" ? "Refresh" : "Retry"}
            </Button>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}
