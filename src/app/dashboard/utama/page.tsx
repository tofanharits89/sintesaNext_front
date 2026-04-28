"use client";

import { useEffect, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardHeader, QuickStatsSection, ChartsSection } from "@/components/dashboard/sections";
import { useDashboardData, useDashboardFilters } from "@/hooks/dashboard";
import { formatJakartaDateTime } from "@/utils/formatters";
import { apiClient } from "@/lib/api/httpClient";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardUtamaPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { selectedKanwil, lastRefreshText, setLastRefreshText, handleKanwilChange, selectedYear, handleYearChange } = useDashboardFilters();
  const dashboardData = useDashboardData(selectedKanwil, selectedYear);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const userRole = String(user?.role || "").toLowerCase();
  const canRefresh = userRole === "super_admin" || userRole === "co_admin";

  const lastRefreshJakarta = (dashboardData.quickStats.data as any)?._meta?.asOfJakarta as string | undefined;

  useEffect(() => {
    const formattedDate = formatJakartaDateTime(lastRefreshJakarta);
    setLastRefreshText(formattedDate);
  }, [lastRefreshJakarta, setLastRefreshText]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Invalidate backend (Redis) cache
      await apiClient.post("/cache/invalidate/dashboard");

      // Invalidate all client-side React Query dashboard caches
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["quick-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["realisasi-per-jenis-belanja"] }),
        queryClient.invalidateQueries({ queryKey: ["realisasi-kl-pagu-terbesar"] }),
        queryClient.invalidateQueries({ queryKey: ["realisasi-kl-pagu-program-terbesar"] }),
        queryClient.invalidateQueries({ queryKey: ["tren-realisasi-bulanan-per-jenis-belanja"] }),
        queryClient.invalidateQueries({ queryKey: ["persentase-realisasi-kl"] }),
        queryClient.invalidateQueries({ queryKey: ["realisasi-kl-per-fungsi"] }),
      ]);

      toast.success("Data dashboard berhasil diperbarui");
    } catch (error: any) {
      console.error("Dashboard refresh failed:", error);
      toast.error(error?.message || "Gagal memperbarui data dashboard");
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient]);

  return (
    <div className="space-y-6">
      <DashboardHeader
        selectedKanwil={selectedKanwil}
        onKanwilChange={handleKanwilChange}
        selectedYear={selectedYear}
        onYearChange={handleYearChange}
        lastRefreshText={lastRefreshText}
        onRefresh={canRefresh ? handleRefresh : undefined}
        isRefreshing={isRefreshing}
      />

      <QuickStatsSection
        quickStats={dashboardData.quickStats}
      />

      <ChartsSection data={dashboardData} />
    </div>
  );
}
