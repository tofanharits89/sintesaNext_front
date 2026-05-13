"use client";

import React from "react";
import dynamic from "next/dynamic";
import { ApbdPageSkeleton } from "@/components/iku-pa/apbd-skeleton";

const MapApbd = dynamic(() => import("./map-apbd"), {
  ssr: false,
  loading: () => <ApbdPageSkeleton />,
});

export default function ApbdContent() {
  return (
    <div className="space-y-4 p-1">
      <MapApbd />
    </div>
  );
}
