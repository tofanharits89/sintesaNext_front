"use client";

import { useQuery } from "@tanstack/react-query";
import { backendPath } from "@/lib/backend";
import { getAuthTokenFromCookie } from "@/utils/auth-utils";

export interface DasarPencabutanItem {
  kmktunda: string;
  no_kmkcabut: string;
  tglcabut: string;
  uraiancabut: string | null;
  thangcabut: string | number;
}

const fetcher = async (url: string) => {
  const token = getAuthTokenFromCookie();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const resp = await fetch(url, {
    credentials: "include",
    headers,
    signal: AbortSignal.timeout(20000),
  });
  const text = await resp.text();

  if (!resp.ok) {
    let msg = `HTTP ${resp.status}`;
    try {
      const j = JSON.parse(text);
      msg = j?.message || j?.error || msg;
    } catch {}
    throw new Error(msg);
  }

  if (!text.trim()) throw new Error("Empty response from server");
  const result = JSON.parse(text);
  return (result?.data as DasarPencabutanItem[]) ?? [];
};

export function useDasarPencabutanOptions(enabled: boolean = true) {
  const key = enabled
    ? backendPath("/transfer-daerah/dau/kmk/pencabutan/dasar")
    : null;
  const { data, error, isLoading, refetch } = useQuery<DasarPencabutanItem[]>({
    queryKey: ["dasar-pencabutan"],
    queryFn: () => fetcher(key!),
    enabled: !!key && enabled,
    refetchOnWindowFocus: false,
    staleTime: 20 * 60 * 1000, // 20 minutes - reference data
    gcTime: 60 * 60 * 1000, // 60 minutes
  });

  const options = (data || []).map((d) => ({
    value: d.no_kmkcabut,
    label: d.no_kmkcabut,
  }));

  const mutate = refetch; // For backward compatibility

  return { items: data || [], options, isLoading, error, mutate } as const;
}
