import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/httpClient";

interface SupplierDashboardResponse {
  success?: boolean;
  data?: any;
}

export function useSupplierDashboard(year?: string) {
  const isClient = typeof window !== "undefined";

  return useQuery<SupplierDashboardResponse, Error>({
    queryKey: ["supplier-dashboard", year ?? ""],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (year && /^\d{4}$/.test(year)) params.set("year", year);
      const path = `/supplier-analytics/dashboard${params.toString() ? `?${params.toString()}` : ""}`;
      const data = (await apiClient.get(path)) as SupplierDashboardResponse;
      return data;
    },
    enabled: isClient,
    staleTime: 60_000, // 1 minute
  });
}
