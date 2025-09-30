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
    socket.on("session:expired", (data: SessionExpiredEvent) => {
      console.log("[SessionMonitor] Session expired:", data);

      // Clear auth cookies immediately
      if (typeof window !== 'undefined' && (window as any).__clearAuthCookies) {
        console.log('[SessionMonitor] Clearing auth cookies via socket event');
        (window as any).__clearAuthCookies();
      } else {
        // Fallback cookie clearing if __clearAuthCookies is not available
        console.log('[SessionMonitor] Clearing auth cookies (fallback)');
        const cookiesToClear = ['accessToken', 'refreshToken', 'access_token', 'refresh_token', 'authToken', 'auth_token', 'token'];
        cookiesToClear.forEach(name => {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
        });
      }

      if (showNotification) {
        toast.error(data.message || "Your session has expired", {
          duration: 5000,
        });
      }

      // Clear all cached data
      queryClient.clear();

      // Redirect to login
      router.push(redirectTo);
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