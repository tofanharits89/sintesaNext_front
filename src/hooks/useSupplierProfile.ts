import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/httpClient";

export interface SupplierProfileData {
  supplier?: {
    npwp?: string | null;
    nama_vendor?: string | null;
    total_kontrak?: number;
    total_spm?: number;
    realization_ratio?: number;
    satkers_served?: number;
    regions_served?: number;
  } | null;
  history?: any[];
  raw_kontrak?: any[];
}

export interface SupplierProfileResponse {
  success?: boolean;
  data?: SupplierProfileData;
  message?: string;
}

export function useSupplierProfile(params: { vendor?: string; limit?: number; year?: string }) {
  const isClient = typeof window !== "undefined";
  const { vendor, limit = 50, year } = params || {};

  return useQuery<SupplierProfileResponse, Error>({
    queryKey: ["supplier-profile", vendor || "", limit, year || ""],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (vendor) qs.set("vendor", vendor);
      if (limit) qs.set("limit", String(limit));
      if (year && /^\d{4}$/.test(year)) qs.set("year", year);
      const path = `/supplier-analytics/profile?${qs.toString()}`;
      const data = (await apiClient.get(path)) as SupplierProfileResponse;
      return data;
    },
    enabled: isClient && !!vendor,
    staleTime: 60_000,
  });
}
