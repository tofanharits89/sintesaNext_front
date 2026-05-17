"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { GenericCardSkeleton } from "@/components/ui/dashboard-skeletons";
import WeeklyLanding from "@/components/weekly/landing";

export default function WeeklyPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return <GenericCardSkeleton showHeader contentLines={8} />;
  }

  return <WeeklyLanding />;
}
