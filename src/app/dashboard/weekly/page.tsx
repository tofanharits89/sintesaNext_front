"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { GenericCardSkeleton } from "@/components/ui/dashboard-skeletons";
import WeeklyLanding from "@/components/weekly/landing";

// Roles yang bisa akses halaman ini
const ALLOWED_ROLES = ["ditpa", "super_admin", "co_admin", "admin"];

export default function WeeklyPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (!ALLOWED_ROLES.includes(user.role as string)) {
      router.push("/unauthorized?reason=weekly_access_denied");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || !ALLOWED_ROLES.includes(user.role as string)) {
    return <GenericCardSkeleton showHeader contentLines={8} />;
  }

  return <WeeklyLanding />;
}
