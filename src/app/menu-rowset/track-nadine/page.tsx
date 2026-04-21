"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AlertTriangle } from "lucide-react";
import TrackNadineMasuk from "./components/landing-masuk";

function TrackNadineContent() {
  const { hasPermission, isLoading } = useAuth();
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id") || "";

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
            Anda tidak memiliki izin untuk mengakses halaman Track Nadine.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Track Nadine
          </h1>
          <p className="text-sm text-muted-foreground">
            Track disposisi surat Nadine
          </p>
        </div>
      </div>

      <TrackNadineMasuk initialId={idParam} autoSearch={true} />
    </div>
  );
}

export default function TrackNadinePage() {
  return (
    <Suspense 
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }
    >
      <TrackNadineContent />
    </Suspense>
  );
}
