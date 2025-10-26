import { useState, useEffect, useCallback } from "react";
import { http } from "@/lib/api/httpClient";
import { apiPath } from "@/lib/config/base-path";

export type AggregatedMenuItem = {
  menu: string;
  total: number;
  items: { submenu: string; count: number }[];
};

export function useMenuUsageTop(
  defaultMonth?: string,
  defaultLimit: number = 50
) {
  const [data, setData] = useState<AggregatedMenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState<string>(
    defaultMonth || new Date().toISOString().slice(0, 7)
  );
  const [limit, setLimit] = useState<number>(defaultLimit);

  const fetchTop = useCallback(
    async (m = month, l = limit) => {
      setIsLoading(true);
      setError(null);
      try {
        const resp = await http.get(apiPath(`/analytics/menu-usage/top`), {
          params: { month: m, limit: l },
        });
        const json = resp.data;
        if (!json?.success)
          throw new Error(json?.message || "Failed to fetch top menu usage");
        setData(json.data || []);
      } catch (e: any) {
        const status = e?.response?.status;
        const message =
          e?.response?.data?.message ||
          e?.message ||
          "Failed to fetch menu usage";
        if (status === 401) setError("Sesi berakhir. Silakan login kembali.");
        else if (status >= 500) setError("Server bermasalah. Coba lagi nanti.");
        else setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [month, limit]
  );

  useEffect(() => {
    fetchTop();
  }, []);

  return { data, isLoading, error, month, setMonth, limit, setLimit, fetchTop };
}

export async function trackMenuUsage(params: {
  menu: string;
  submenu?: string;
  path?: string;
}) {
  try {
    // Fire-and-forget tracking; Axios doesn't support keepalive. It's okay to swallow errors.
    await http.post(apiPath(`/analytics/menu-usage`), params);
  } catch {
    // swallow errors, tracking should never block UI
  }
}
