"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiPath } from "@/lib/base-path";
import { getAuthTokenFromCookie } from "@/lib/cookieManager";

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
  const url = apiPath("/transfer-daerah/dau/kmk/pencabutan/dasar");
  const queryClient = useQueryClient();
  const { data, error, isLoading } = useQuery<DasarPencabutanItem[]>({
    queryKey: ["dasar-pencabutan-options"],
    queryFn: () => fetcher(url),
    enabled,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    staleTime: 0,
  });

  const options = (data || []).map((d) => ({
    value: d.no_kmkcabut,
    label: d.no_kmkcabut,
  }));

  const mutate = () =>
    queryClient.invalidateQueries({ queryKey: ["dasar-pencabutan-options"] });
  return { items: data || [], options, isLoading, error, mutate } as const;
}
