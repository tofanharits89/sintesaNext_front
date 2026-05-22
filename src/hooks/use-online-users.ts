"use client";

import { useState, useEffect, useCallback } from "react";
import useSocket from "@/hooks/useSocket";
import { useAuth } from "@/hooks/useAuth";

export interface OnlineUser {
  socketId: string;
  user: {
    id: string;
    username: string;
    name: string;
    role: string;
    nmkanwil?: string | null;
    nmkppn?: string | null;
    kdkanwil?: string | null;
    kdkppn?: string | null;
  };
  connectedAt?: string;
  loginAt?: string;
  location?: string;
  lastActivity?: number;
}

export interface UseOnlineUsersReturn {
  onlineUsers: OnlineUser[];
  isConnected: boolean;
  userCount: number;
  refreshUsers: () => void;
  connectionStatus: "connecting" | "connected" | "disconnected" | "error";
  reconnectSocket: () => void;
}

export function useOnlineUsers(): UseOnlineUsersReturn {
  const { isAuthenticated } = useAuth();
  const { socket, isConnected, connectionState, emit, on, off, reconnect } =
    useSocket();

  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error"
  >("disconnected");

  // Map socket connectionState to simplified connectionStatus
  useEffect(() => {
    if (connectionState === "connected") {
      setConnectionStatus("connected");
    } else if (connectionState === "connecting") {
      setConnectionStatus("connecting");
    } else if (connectionState === "disconnected") {
      setConnectionStatus("disconnected");
    } else {
      setConnectionStatus("error");
    }
  }, [connectionState]);

  // Handler for users:online event (full list)
  const handleUsersOnline = useCallback(
    (
      response:
        | {
            success: boolean;
            data: OnlineUser[] | { users: OnlineUser[] };
            error?: any;
          }
        | OnlineUser[]
    ) => {
      try {
        if (Array.isArray(response)) {
          const usersWithTimestamp = response.map((user) => ({
            ...user,
            connectedAt: user.connectedAt || new Date().toISOString(),
          }));
          setOnlineUsers(usersWithTimestamp);
          return;
        }

        if (!response || typeof response !== "object") return;
        if (!response.success) return;

        let users: OnlineUser[] = [];
        if (
          response.data &&
          typeof response.data === "object" &&
          "users" in response.data
        ) {
          users = Array.isArray((response.data as any).users)
            ? (response.data as any).users
            : [];
        } else if (Array.isArray((response as any).data)) {
          users = (response as any).data as OnlineUser[];
        }

        const usersWithTimestamp = users.map((user) => ({
          ...user,
          connectedAt: user.connectedAt || new Date().toISOString(),
        }));
        setOnlineUsers(usersWithTimestamp);
      } catch {}
    },
    []
  );

  // Incremental add on user:online (fallback to avoid race with refresh)
  const handleUserOnlinePush = useCallback((payload: any) => {
    try {
      const u = payload?.user || payload;
      if (!u || !u.id) return;
      setOnlineUsers((prev) => {
        // Deduplicate by socketId to support multiple sessions for the same user
        if (prev.some((p) => p?.socketId === payload?.socketId)) return prev;
        
        const item: OnlineUser = {
          socketId: payload?.socketId || `sock-${u.id}-${Date.now()}`,
          user: {
            id: String(u.id),
            username: u.username || "",
            name: u.name || u.username || "",
            role: u.role || "",
            nmkanwil: u.nmkanwil || null,
            nmkppn: u.nmkppn || null,
            kdkanwil: u.kdkanwil || null,
            kdkppn: u.kdkppn || null,
          },
          connectedAt: payload?.connectedAt || new Date().toISOString(),
          loginAt: payload?.loginAt || new Date().toISOString(),
          location: payload?.location || null,
        };
        return [item, ...prev];
      });
    } catch {}
  }, []);

  const refreshOnPresenceEvent = useCallback(() => {
    try {
      emit("users:get-online");
    } catch (err) {
      // Failed to refresh on presence event
    }
  }, [emit]);

  // Subscribe to users:online and request initial list when connected and authenticated
  useEffect(() => {
    // Register listeners (support both legacy and v2 events)
    on("users:online", handleUsersOnline);
    on("user:online", handleUserOnlinePush);
    on("users:online:v2", handleUsersOnline);

    // If connected and authenticated, request initial users
    if (isConnected && isAuthenticated) {
      try {
        emit("users:get-online");
        // Also refresh list when we hear any user presence signals
        on("user:online", refreshOnPresenceEvent);
        on("user:login", refreshOnPresenceEvent);
        on("user:offline", refreshOnPresenceEvent);
        on("user:logout", refreshOnPresenceEvent);
        // Some parts of the stack may emit a consolidated update event
        on("users:updated", handleUsersOnline);
      } catch (err) {
        // emit may throw if socket not available; ignore and rely on reconnect to trigger request
      }
    }

    return () => {
      off("users:online", handleUsersOnline);
      off("users:online:v2", handleUsersOnline);
      off("user:online", refreshOnPresenceEvent);
      off("user:login", refreshOnPresenceEvent);
      off("user:offline", refreshOnPresenceEvent);
      off("user:logout", refreshOnPresenceEvent);
      off("users:updated", handleUsersOnline);
    };
  }, [isConnected, isAuthenticated, on, off, emit, handleUsersOnline, refreshOnPresenceEvent]);

  const refreshUsers = useCallback(() => {
    if (isConnected && isAuthenticated) {
      try {
        emit("users:get-online");
      } catch (err) {
        // If emit failed, attempt reconnect
        reconnect();
      }
    } else {
      // Not connected: attempt reconnect which will trigger a users:get-online once connected
      reconnect();
    }
  }, [isConnected, isAuthenticated, emit, reconnect]);

  const reconnectSocket = useCallback(() => {
    reconnect();
  }, [reconnect]);

  return {
    onlineUsers,
    isConnected,
    userCount: onlineUsers.length,
    refreshUsers,
    connectionStatus,
    reconnectSocket,
  };
}

export default useOnlineUsers;
