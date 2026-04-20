"use client";

import React from "react";
import dynamic from "next/dynamic";

const MapApbd = dynamic(() => import("./map-apbd"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
      Memuat peta…
    </div>
  ),
});

export default function ApbdContent() {
  return (
    <div className="space-y-4 p-1">
      <MapApbd />
    </div>
  );
}
