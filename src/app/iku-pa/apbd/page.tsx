"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import ApbdContent from "@/components/iku-pa/apbd";

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
      const isKanwil = user.role === "kanwil_djpb";

      if (!isAdmin && !isKanwil) {
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
  const isKanwil = user.role === "kanwil_djpb";
  if (!isAdmin && !isKanwil) return null;

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
