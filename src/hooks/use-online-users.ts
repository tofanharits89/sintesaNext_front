"use client";

import { useState, useEffect, useCallback } from "react";
import useSocket from "@/hooks/useSocket";

export interface OnlineUser {
  socketId: string;
  user: {
    id: string;
    username: string;
    name: string;
    role: string;
  };
  connectedAt?: string;
  loginAt?: string;
  location?: string;
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

  // Handler for users:online event
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
        // Handle legacy format (direct array)
        if (Array.isArray(response)) {
          const usersWithTimestamp = response.map((user) => ({
            ...user,
            connectedAt: user.connectedAt || new Date().toISOString(),
          }));
          setOnlineUsers(usersWithTimestamp);
          return;
        }

        if (!response || typeof response !== "object") {
          console.error(
            "[useOnlineUsers] Invalid users:online payload",
            response
          );
          setOnlineUsers([]);
          return;
        }

        if (!response.success) {
          const err = response.error || {
            message: "Failed to get online users",
          };
          console.error("[useOnlineUsers] Online users request failed:", err);
          setOnlineUsers([]);
          return;
        }

        // Handle new format: { success, data: { users } }
        let users: OnlineUser[] = [];
        if (
          response.data &&
          typeof response.data === "object" &&
          "users" in response.data
        ) {
          users = Array.isArray(response.data.users) ? response.data.users : [];
        } else if (Array.isArray(response.data)) {
          // Handle old format: { success, data: OnlineUser[] }
          users = response.data;
        }

        const usersWithTimestamp = users.map((user) => ({
          ...user,
          connectedAt: user.connectedAt || new Date().toISOString(),
        }));
        setOnlineUsers(usersWithTimestamp);
      } catch (err) {
        console.error("[useOnlineUsers] Error processing online users:", err);
        setOnlineUsers([]);
      }
    },
    []
  );

  // Subscribe to users:online and request initial list when connected
  useEffect(() => {
    // Register listeners (support both legacy and v2 events)
    on("users:online", handleUsersOnline);
    on("users:online:v2", handleUsersOnline);

    // If connected, request initial users
    if (isConnected) {
      try {
        emit("users:get-online");
        // Also refresh list when we hear any user presence signals
        const refreshOnPresenceEvent = () => {
          try {
            emit("users:get-online");
          } catch (err) {
            console.warn(
              "[useOnlineUsers] Failed to refresh on presence event:",
              err
            );
          }
        };
        on("user:login", refreshOnPresenceEvent);
        on("user:offline", refreshOnPresenceEvent);
        on("user:logout", refreshOnPresenceEvent);
        // Some parts of the stack may emit a consolidated update event
        on("users:updated", handleUsersOnline);
      } catch (err) {
        // emit may throw if socket not available; ignore and rely on reconnect to trigger request
        console.warn(
          "[useOnlineUsers] Failed to emit users:get-online on mount:",
          err
        );
      }
    }

    return () => {
      off("users:online", handleUsersOnline);
      off("users:online:v2", handleUsersOnline);
      off("user:login");
      off("user:offline");
      off("user:logout");
      off("users:updated", handleUsersOnline);
    };
  }, [isConnected, on, off, emit, handleUsersOnline]);

  const refreshUsers = useCallback(() => {
    if (isConnected) {
      try {
        emit("users:get-online");
      } catch (err) {
        console.warn(
          "[useOnlineUsers] refreshUsers: emit failed, attempting reconnect",
          err
        );
        // If emit failed, attempt reconnect
        reconnect();
      }
    } else {
      // Not connected: attempt reconnect which will trigger a users:get-online once connected
      reconnect();
    }
  }, [isConnected, emit, reconnect]);

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
