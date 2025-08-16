"use client";

import { useEffect, useState, useCallback } from "react";
import { useSocket } from "./useSocket";
import type { Notification } from "@/lib/notifications-store";
import {
  getNotificationsForUser,
  getUnreadNotificationCount,
} from "@/lib/notifications-store";
import { useCurrentUser } from "@/lib/use-current-user";

export function useNotifications() {
  const { socket, isConnected } = useSocket();
  const { currentUser } = useCurrentUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    if (!currentUser?.username) return;
    try {
      const list = await getNotificationsForUser(currentUser.username);
      setNotifications(list);
      const count = await getUnreadNotificationCount(currentUser.username);
      setUnreadCount(count);
    } catch (e) {
      console.warn("Failed to load notifications:", e);
    }
  }, [currentUser?.username]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNew = (payload: any) => {
      // v1: raw object
      setNotifications((prev) => [payload, ...prev]);
      setUnreadCount((c) => c + 1);
    };
    const handleNewV2 = (resp: any) => {
      if (!resp?.success || !resp?.data) return;
      setNotifications((prev) => [resp.data, ...prev]);
      setUnreadCount((c) => c + 1);
    };

    socket.on("notification:new", handleNew);
    socket.on("notification:new:v2", handleNewV2);

    return () => {
      socket.off("notification:new", handleNew);
      socket.off("notification:new:v2", handleNewV2);
    };
  }, [socket, isConnected]);

  return { notifications, unreadCount, reload: load };
}

