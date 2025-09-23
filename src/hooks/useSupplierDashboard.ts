import { useQuery } from "@tanstack/react-query";

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
      const url = new URL(
        (process.env.NEXT_PUBLIC_BASE_PATH || "/v3/next") +
          `/api/supplier-analytics/dashboard${params.toString() ? `?${params.toString()}` : ""}`,
        window.location.origin
      );

      const resp = await fetch(url.toString(), {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = (await resp.json().catch(() => ({}))) as SupplierDashboardResponse;
      return data;
    },
    enabled: isClient,
    staleTime: 60_000, // 1 minute
  });
}
