"use client";

import React from "react";
import MonitoringBlokir from "@/components/blokir-perjadin/monitoringblokir";
import { useAuth } from "@/hooks/useAuth";

export default function Page() {
  const { user, isLoading } = useAuth();

  // Simple role mapping to match legacy component expectations
  const getLegacyRole = (role?: string) => {
    switch (role) {
      case "kanwil_djpb":
        return "2";
      case "kppn":
        return "3";
      case "super_admin":
      case "co_admin":
      case "kantor_pusat":
      case "ditpa":
        return "0";
      default:
        return "0";
    }
  };

  return (
    <MonitoringBlokir
      authLoading={isLoading}
      role={getLegacyRole(user?.role)}
      kdkanwil={user?.kdkanwil || ""}
      kdkppn={user?.kdkppn || ""}
      username={user?.username || ""}
      // Token is handled by HttpOnly cookies in this architecture
      token=""
    />
  );
}
