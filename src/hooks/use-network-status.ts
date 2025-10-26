"use client";

import { useState, useEffect } from "react";

/**
 * Hook for monitoring network connectivity status
 * Provides online/offline status and connection quality indicators
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [connectionType, setConnectionType] = useState<string | null>(null);
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  useEffect(() => {
    // Handle online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      console.log("[NetworkStatus] Connection restored");
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log("[NetworkStatus] Connection lost");
    };

    // Handle connection type changes (if supported)
    const handleConnectionChange = () => {
      if ("connection" in navigator) {
        const connection = (navigator as any).connection;
        setConnectionType(connection.effectiveType || null);
        
        // Consider 2g and slow-2g as slow connections
        setIsSlowConnection(
          connection.effectiveType === "2g" || 
          connection.effectiveType === "slow-2g"
        );
        
        console.log("[NetworkStatus] Connection type:", connection.effectiveType);
      }
    };

    // Add event listeners
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Monitor connection type if supported
    if ("connection" in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener("change", handleConnectionChange);
      
      // Set initial connection type
      handleConnectionChange();
    }

    // Cleanup
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      
      if ("connection" in navigator) {
        const connection = (navigator as any).connection;
        connection.removeEventListener("change", handleConnectionChange);
      }
    };
  }, []);

  // Test connection quality by measuring response time
  const testConnectionSpeed = async (): Promise<number> => {
    if (!isOnline) return -1;

    try {
      const startTime = Date.now();
      
      // Use a small image or endpoint to test speed
      await fetch("/favicon.ico", { 
        method: "HEAD",
        cache: "no-cache" 
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log("[NetworkStatus] Response time:", responseTime, "ms");
      return responseTime;
    } catch (error) {
      console.error("[NetworkStatus] Speed test failed:", error);
      return -1;
    }
  };

  return {
    isOnline,
    connectionType,
    isSlowConnection,
    testConnectionSpeed,
  };
}
