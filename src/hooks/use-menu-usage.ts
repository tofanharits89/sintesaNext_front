import { useState, useEffect, useCallback } from "react";
import { apiPath } from "@/lib/base-path";

export type AggregatedMenuItem = {
  menu: string;
  total: number;
  items: { submenu: string; count: number }[];
};

export function useMenuUsageTop(defaultMonth?: string, defaultLimit: number = 50) {
  const [data, setData] = useState<AggregatedMenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState<string>(
    defaultMonth || new Date().toISOString().slice(0, 7)
  );
  const [limit, setLimit] = useState<number>(defaultLimit);

  const fetchTop = useCallback(async (m = month, l = limit) => {
    setIsLoading(true);
    setError(null);
    try {
      const url = new URL(apiPath("/analytics/menu-usage/top"), window.location.origin);
      url.searchParams.set("month", m);
      url.searchParams.set("limit", String(l));
      const resp = await fetch(url.toString(), { credentials: "include" });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();
      if (!json.success) throw new Error(json.message || "Failed to fetch top menu usage");
      setData(json.data || []);
    } catch (e: any) {
      setError(e.message || "Failed to fetch menu usage");
    } finally {
      setIsLoading(false);
    }
  }, [month, limit]);

  useEffect(() => {
    fetchTop();
  }, []);

  return { data, isLoading, error, month, setMonth, limit, setLimit, fetchTop };
}

export async function trackMenuUsage(params: { menu: string; submenu?: string; path?: string }) {
  try {
    await fetch(apiPath("/analytics/menu-usage"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      keepalive: true, // allow to send during navigation/unload
    });
  } catch {
    // swallow errors, tracking should never block UI
  }
}

