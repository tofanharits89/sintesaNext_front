"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { backendPath } from "@/lib/backend";

export interface OptionItem {
  value: string;
  label: string;
}

const fetcher = async (url: string) => {
  const resp = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(20000),
    cache: "no-store",
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
  return result?.data ?? result;
};

export function useJenisKmkOptions() {
  const url = backendPath("/transfer-daerah/dau/ref/jenis");
  const queryClient = useQueryClient();
  const { data, error, isLoading } = useQuery<any[]>({
    queryKey: ["jenis-kmk-options"],
    queryFn: () => fetcher(url),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    staleTime: 0,
  });

  const options: OptionItem[] = (data || [])
    .map((r) => {
      const jenis = String(r.jenis ?? r.value ?? "");
      if (!jenis) return null;
      const nm = String(r.nmjenis ?? r.label ?? "");
      return {
        value: jenis,
        label: nm ? `${jenis} - ${nm}` : jenis,
      } as OptionItem;
    })
    .filter(Boolean) as OptionItem[];

  const mutate = () => queryClient.invalidateQueries({ queryKey: ["jenis-kmk-options"] });
  return { options, isLoading, error, mutate } as const;
}
