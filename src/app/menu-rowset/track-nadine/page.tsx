"use client";

import TrackNadineMasuk from "./components/landing-masuk";

export default function TrackNadinePage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Track Nadine
          </h1>
          <p className="text-sm text-muted-foreground">
            Track disposisi surat Nadine (Surat Masuk)
          </p>
        </div>
      </div>

      <TrackNadineMasuk />
    </div>
  );
}
