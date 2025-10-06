"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { io, Socket } from "socket.io-client";

interface SessionExpiredEvent {
  reason: string;
  message: string;
  timestamp: string;
}

interface UseSessionMonitorOptions {
  enabled?: boolean;
  redirectTo?: string;
  showNotification?: boolean;
}

/**
 * Hook that monitors session status via WebSocket and handles session expiration
 */
export function useSessionMonitor(options: UseSessionMonitorOptions = {}) {
  const {
    enabled = true,
    redirectTo = "/login",
    showNotification = true,
  } = options;

  const router = useRouter();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Initialize socket connection
    const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000", {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    // Listen for session expiration events
    socket.on("session:expired", async (data: SessionExpiredEvent) => {
      console.log("[SessionMonitor] Session expired:", data);

      // Prevent multiple simultaneous handlers
      if ((window as any).__handlingSessionExpired) {
        console.log('[SessionMonitor] Already handling session expiration, skipping...');
        return;
      }
      (window as any).__handlingSessionExpired = true;

      // Call backend logout API to invalidate session
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        });
      } catch (logoutError) {
        console.warn('[SessionMonitor] Backend logout failed (continuing anyway):', logoutError);
      }

      // Clear auth cookies and storage properly
      try {
        const { performLogoutCleanup } = await import('@/lib/cookieManager');
        console.log('[SessionMonitor] Clearing cookies and storage...');
        await performLogoutCleanup();
      } catch (error) {
        console.error('[SessionMonitor] Error clearing cookies:', error);
      }

      if (showNotification) {
        toast.error(data.message || "Your session has expired", {
          duration: 5000,
        });
      }

      // Clear all cached data
      queryClient.clear();

      // Redirect to login with reason
      const redirectReason = data.reason === 'LOGGED_IN_ELSEWHERE' 
        ? 'logged_in_elsewhere' 
        : 'session_expired';
      const message = data.message || 'Your session has expired';
      
      window.location.href = `${redirectTo}?reason=${redirectReason}&message=${encodeURIComponent(message)}`;
    });

    // Listen for connection events
    socket.on("connect", () => {
      console.log("[SessionMonitor] Socket connected");
    });

    socket.on("disconnect", (reason) => {
      console.log("[SessionMonitor] Socket disconnected:", reason);
    });

    socket.on("connect_error", (error) => {
      console.warn("[SessionMonitor] Socket connection error:", error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [enabled, redirectTo, showNotification, router, queryClient]);

  return {
    isConnected: socketRef.current?.connected ?? false,
  };
}