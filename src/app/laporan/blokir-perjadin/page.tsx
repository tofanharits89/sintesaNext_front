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
        return "0";
      default:
        return "0";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // If used in a protected route layout, user might not be null here.
  // But just in case, we can handle it or let the component handle empty props.

  return (
    <MonitoringBlokir
      role={getLegacyRole(user?.role)}
      kdkanwil={user?.kdkanwil || ""}
      kdkppn={user?.kdkppn || ""}
      username={user?.username || ""}
      // Token is handled by HttpOnly cookies in this architecture
      token=""
    />
  );
}
