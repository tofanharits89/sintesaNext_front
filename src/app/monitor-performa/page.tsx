"use client";

import { PerformanceMonitoringDashboard } from "@/components/dashboard/PerformanceMonitoringDashboard";
import { Monitor } from "lucide-react";

export default function MonitorPerformaPage() {
  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Monitor Performa</h1>
      </div>
      
      <PerformanceMonitoringDashboard />
    </div>
  );
}