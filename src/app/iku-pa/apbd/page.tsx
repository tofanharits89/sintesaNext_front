"use client";

import React from "react";
import ApbdContent from "@/components/iku-pa/apbd";

export default function ApbdPage() {
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
