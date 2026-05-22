"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LandingPenilaianIku } from "@/components/transfer-daerah/penilaian-iku/landing";
import { useAuth } from "@/hooks/useAuth";

export default function PenilaianIkuPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
        return;
      }
      const isAdmin = user.role === "super_admin" || user.role === "co_admin";
      const isDitpa = user.role === "ditpa";
      if (!isAdmin && !isDitpa) {
        router.replace("/unauthorized");
      }
    }
  }, [user, isLoading, router]);

  const getLegacyRole = (role?: string) => {
    switch (role) {
      case "kppn":
        return "3";
      case "kanwil_djpb":
        return "2";
      default:
        return "0";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  const isAdmin = user.role === "super_admin" || user.role === "co_admin";
  const isDitpa = user.role === "ditpa";
  if (!isAdmin && !isDitpa) return null;

  return (
    <LandingPenilaianIku
      role={getLegacyRole(user?.role)}
      username={user?.username ?? ""}
      kdkppn={user?.kdkppn ?? ""}
    />
  );
}

export const dynamic = "force-dynamic";
