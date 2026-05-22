"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/hooks/useAuth";

const getRoleDisplayName = (role: string): string => {
  const roleMap: Record<string, string> = {
    super_admin: "Super Admin",
    co_admin: "Co-Admin",
    kantor_pusat: "Kantor Pusat",
    ditpa: "DIT PA",
    kanwil: "Kanwil DJPb",
    kppn: "KPPN",
    lainnya: "User Lainnya",
  };
  return roleMap[role] || role;
};

export const useLoginNotifications = () => {
  const { user: currentUser } = useAuth();
  const { socket, isConnected, isReady } = useSocket();

  // Check if user is admin - prevents unnecessary socket operations
  const isAdmin = currentUser && ["super_admin", "co_admin"].includes(currentUser.role);

  // Don't show notifications on login page
  const isLoginPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/login');

  // Track recently shown toasts to prevent duplicates from different events for the same user
  const recentToasts = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    // Early return if not admin or on login page
    if (!isAdmin || isLoginPage) {
      return;
    }

    if (!socket || !isConnected || !isReady) {
      return;
    }

    // Dedup helper: skip if same user triggered a toast within the last 5 seconds
    const shouldSkip = (userId: string): boolean => {
      const now = Date.now();
      const lastShown = recentToasts.current.get(userId);
      if (lastShown && now - lastShown < 5000) return true;
      recentToasts.current.set(userId, now);
      // Clean old entries
      for (const [key, ts] of recentToasts.current) {
        if (now - ts > 10000) recentToasts.current.delete(key);
      }
      return false;
    };

    // Handler for user:login event (structured with user object + loginTime)
    const handleUserLogin = (data: any) => {
      const user = data?.user || data?.data?.user;
      if (!user) return;

      const userId = String(user.id);
      if (userId === String(currentUser.id)) return;
      if (shouldSkip(userId)) return;

      const name = user.name || user.username || "Unknown";
      const username = user.username || "";
      const role = user.role || "";

      let timeStr = "";
      if (data.loginTime) {
        try {
          timeStr = new Date(data.loginTime).toLocaleString("id-ID", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });
        } catch {}
      }

      toast.info(`${name} (${username}) telah login`, {
        description: timeStr
          ? `Role: ${getRoleDisplayName(role)} • ${timeStr}`
          : `Role: ${getRoleDisplayName(role)}`,
        duration: 5000,
      });
    };

    // Handler for user:login:v2 event (wrapped in { success, data })
    const handleUserLoginV2 = (response: any) => {
      if (!response?.success || !response?.data) return;
      handleUserLogin(response.data);
    };

    // Handler for user:online event (emitted by backend on socket connection)
    const handleUserOnline = (payload: any) => {
      try {
        const user = payload?.user || payload?.data?.user || payload;
        const userId = String(user?.id || user?.user?.id);
        if (!userId || userId === String(currentUser.id)) return;
        if (shouldSkip(userId)) return;

        const name = user?.name || user?.username || user?.user?.name || user?.user?.username || "Unknown";
        const username = user?.username || user?.user?.username || "";
        const role = user?.role || user?.user?.role || "";

        toast.info(`${name} (${username}) telah login`, {
          description: `Role: ${getRoleDisplayName(role)}`,
          duration: 5000,
        });
      } catch {}
    };

    // Listen for all login/presence events
    socket.on("user:online", handleUserOnline);
    socket.on("user:login", handleUserLogin);
    socket.on("user:login:v2", handleUserLoginV2);

    // Cleanup
    return () => {
      socket.off("user:online", handleUserOnline);
      socket.off("user:login", handleUserLogin);
      socket.off("user:login:v2", handleUserLoginV2);
    };
  }, [isAdmin, isLoginPage, currentUser?.id, socket, isConnected, isReady]);
};

