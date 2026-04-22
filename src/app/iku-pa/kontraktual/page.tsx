"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import KontraktualContent from "@/components/iku-pa/kontraktual";

export default function KontraktualPage() {
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">IKI Kontraktual</h1>
          <p className="text-sm text-muted-foreground">
            Monitoring Indikator Kinerja Pelaksanaan Anggaran Kontraktual
          </p>
        </div>
      </div>

      <section>
        <KontraktualContent />
      </section>
    </div>
  );
}
