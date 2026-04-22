"use client";

import { use, Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AlertTriangle } from "lucide-react";
import TrackNadineMasuk from "../track-nadine/components/landing-masuk";

export default function MenuRowsetIdPage({
  params,
}: {
  params: Promise<{ id?: string }>;
}) {
  const resolvedParams = use(params);
  const { hasPermission, isLoading } = useAuth();
  const id = resolvedParams?.id ?? "";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasPermission("nadine", "view")) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2 text-rose-500 bg-rose-50/50 dark:bg-rose-950/20 p-8 rounded-2xl border border-rose-100 dark:border-rose-900/50 shadow-sm animate-in zoom-in-95 duration-300">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-xl font-bold">Akses Ditolak</h2>
          <p className="text-sm text-balance max-w-xs mx-auto text-rose-600/80 dark:text-rose-400/80">
            Anda tidak memiliki izin untuk mengakses halaman Track Nadine melalui link ini.
          </p>
        </div>
      </div>
    );
  }

  return <TrackNadineMasuk initialId={id} autoSearch={true} />;
}
