"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useSocket } from "@/hooks/useSocket";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";

interface LoginEvent {
  user: {
    id: string;
    name: string;
    username: string;
    role: string;
  };
  loginTime: string;
  timestamp: string;
}

interface LoginEventV2 {
  success: boolean;
  data: LoginEvent;
  timestamp: string;
}

const getRoleDisplayName = (role: string): string => {
  const roleMap: Record<string, string> = {
    super_admin: "Super Admin",
    co_admin: "Co-Admin",
    kantor_pusat: "Kantor Pusat",
    kanwil: "Kanwil DJPb",
    kppn: "KPPN",
    lainnya: "User Lainnya",
  };
  return roleMap[role] || role;
};

export const useLoginNotifications = () => {
  const { user: currentUser } = useUnifiedAuth();
  const { socket, isConnected, isReady } = useSocket();
  
  // Check if user is admin - prevents unnecessary socket operations
  const isAdmin = currentUser && ["super_admin", "co_admin"].includes(currentUser.role);
  
  // Don't show notifications on login page
  const isLoginPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/login');

  useEffect(() => {
    // Early return if not admin or on login page
    if (!isAdmin || isLoginPage) {
      return;
    }

    if (!socket || !isConnected || !isReady) {
      console.log("[LoginNotifications] Socket not ready:", {
        hasSocket: !!socket,
        isConnected,
        isReady,
      });
      return;
    }

    const handleUserLogin = (data: LoginEvent) => {
      console.log("[LoginNotifications] User login event received:", data);

      // Don't show notification for own login
      if (data.user.id === currentUser.id) {
        return;
      }

      const loginTime = new Date(data.loginTime).toLocaleString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      toast.info(`${data.user.name} (${data.user.username}) telah login`, {
        description: `Role: ${getRoleDisplayName(
          data.user.role
        )} • ${loginTime}`,
        duration: 5000,
      });
    };

    const handleUserLoginV2 = (response: LoginEventV2) => {
      console.log("[LoginNotifications] User login v2 event received:", response);

      if (!response.success || !response.data) {
        console.warn("[LoginNotifications] Invalid login event response:", response);
        return;
      }

      handleUserLogin(response.data);
    };

    // Listen for user login events (prefer v2 with fallback to v1)
    socket.on("user:login:v2", handleUserLoginV2);
    socket.on("user:login", handleUserLogin);

    console.log(
      "[LoginNotifications] Login notification listener registered for admin user:",
      currentUser.username
    );

    // Cleanup
    return () => {
      socket.off("user:login:v2", handleUserLoginV2);
      socket.off("user:login", handleUserLogin);
      console.log("[LoginNotifications] Login notification listeners removed");
    };
  }, [isAdmin, isLoginPage, currentUser, socket, isConnected, isReady]);
};
