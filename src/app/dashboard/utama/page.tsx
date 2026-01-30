"use client";

import { useEffect } from "react";
import { DashboardHeader, QuickStatsSection, ChartsSection } from "@/components/dashboard/sections";
import { useDashboardData, useDashboardFilters } from "@/hooks/dashboard";
import { formatJakartaDateTime } from "@/utils/formatters";

export default function DashboardUtamaPage() {
  const { selectedKanwil, lastRefreshText, setLastRefreshText, handleKanwilChange, selectedYear, handleYearChange } = useDashboardFilters();
  const dashboardData = useDashboardData(selectedKanwil, selectedYear);

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
        selectedYear={selectedYear}
        onYearChange={handleYearChange}
        lastRefreshText={lastRefreshText}
      />

      <QuickStatsSection
        quickStats={dashboardData.quickStats}
      />

      <ChartsSection data={dashboardData} />
    </div>
  );
}
