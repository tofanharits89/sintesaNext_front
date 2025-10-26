"use client";

import { useEffect } from "react";
import { DashboardHeader, QuickStatsSection, ChartsSection } from "@/components/dashboard/sections";
import { useDashboardData, useDashboardFilters } from "@/hooks/dashboard";
import { formatJakartaDateTime } from "@/utils/formatters";

export default function DashboardUtamaPage() {
  const { selectedKanwil, lastRefreshText, setLastRefreshText, handleKanwilChange } = useDashboardFilters();
  const dashboardData = useDashboardData(selectedKanwil);
  
  const lastRefreshJakarta = (dashboardData.quickStats.data as any)?._meta?.asOfJakarta as string | undefined;

  useEffect(() => {
    const formattedDate = formatJakartaDateTime(lastRefreshJakarta);
    setLastRefreshText(formattedDate);
  }, [lastRefreshJakarta, setLastRefreshText]);

  return (
    <div className="space-y-6">
      <DashboardHeader
        selectedKanwil={selectedKanwil}
        onKanwilChange={handleKanwilChange}
        lastRefreshText={lastRefreshText}
      />
      
      <QuickStatsSection
        quickStats={dashboardData.quickStats}
      />
      
      <ChartsSection data={dashboardData} />
    </div>
  );
}
