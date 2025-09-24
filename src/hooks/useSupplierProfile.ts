import { useQuery } from "@tanstack/react-query";

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

export function useSupplierProfile(params: { npwp?: string; vendor?: string; limit?: number; year?: string }) {
  const isClient = typeof window !== "undefined";
  const { npwp, vendor, limit = 50, year } = params || {};

  return useQuery<SupplierProfileResponse, Error>({
    queryKey: ["supplier-profile", npwp || "", vendor || "", limit, year || ""],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (npwp) qs.set("npwp", npwp);
      if (vendor) qs.set("vendor", vendor);
      if (limit) qs.set("limit", String(limit));
      if (year && /^\d{4}$/.test(year)) qs.set("year", year);

      const url = new URL(
        (process.env.NEXT_PUBLIC_BASE_PATH || "/v3/next") + `/api/supplier-analytics/profile?${qs.toString()}`,
        window.location.origin
      );

      const resp = await fetch(url.toString(), {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = (await resp.json().catch(() => ({}))) as SupplierProfileResponse;
      return data;
    },
    enabled: isClient && (!!npwp || !!vendor),
    staleTime: 60_000,
  });
}
