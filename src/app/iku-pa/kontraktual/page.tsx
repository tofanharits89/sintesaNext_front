"use client";

import React from "react";
import KontraktualContent from "@/components/iku-pa/kontraktual";

export default function KontraktualPage() {
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
