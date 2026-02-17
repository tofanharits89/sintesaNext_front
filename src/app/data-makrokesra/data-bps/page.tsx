"use client";

import { DataBPSContent } from "./components";

export default function DataBPSPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Data BPS</h1>
          <p className="text-sm text-muted-foreground">
            Data berasal dari WebAPI Badan Pusat Statistik (BPS) Republik
            Indonesia
          </p>
        </div>
      </div>

      <DataBPSContent />
    </div>
  );
}
