"use client";

import { useQuery } from "@tanstack/react-query";
import { apiPath } from "@/lib/config/base-path";
import { getAuthTokenFromCookie } from "@/lib/utils/cookieManager";

export interface DasarPenundaanItem {
  no_kmk: string;
  tgl_kmk?: string | null;
  jenis?: string | number | null;
  kriteria?: string | number | null;
  uraian?: string | null;
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
  return (result?.data as DasarPenundaanItem[]) ?? [];
};

export function useDasarPenundaanOptions(enabled: boolean = true) {
  const key = enabled
    ? apiPath("/transfer-daerah/dau/kmk/penundaan/dasar")
    : null;
  const { data, error, isLoading, refetch } = useQuery<DasarPenundaanItem[]>({
    queryKey: ["dasar-penundaan"],
    queryFn: () => fetcher(key!),
    enabled: !!key && enabled,
    refetchOnWindowFocus: false,
    staleTime: 20 * 60 * 1000, // 20 minutes - reference data
    gcTime: 60 * 60 * 1000, // 60 minutes
  });

  const options = (data || []).map((d) => ({
    value: d.no_kmk,
    label: d.no_kmk,
  }));

  const mutate = refetch; // For backward compatibility

  return { items: data || [], options, isLoading, error, mutate } as const;
}
