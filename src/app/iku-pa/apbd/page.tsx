"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import ApbdContent from "@/components/iku-pa/apbd";
import { ApbdPageSkeleton } from "@/components/iku-pa/apbd-skeleton";

export default function ApbdPage() {
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
        router.push("/unauthorized");
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <ApbdPageSkeleton />;
  }

  if (!user) return null;

  const isAdmin = user.role === "super_admin" || user.role === "co_admin";
  const isDitpa = user.role === "ditpa";
  if (!isAdmin && !isDitpa) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">IKI PAPD</h1>
          <p className="text-sm text-muted-foreground">
            Monitoring Indikator Kinerja Pelaksanaan Anggaran APBD
          </p>
        </div>
      </div>

      <section>
        <ApbdContent />
      </section>
    </div>
  );
}
