"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import TrackNadineMasuk from "./components/landing-masuk";

export default function TrackNadinePage() {
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id") || "";
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

