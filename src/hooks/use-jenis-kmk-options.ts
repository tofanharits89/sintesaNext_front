"use client";

import { useQuery } from "@tanstack/react-query";
import { apiPath } from "@/lib/base-path";

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
const key = apiPath("/transfer-daerah/dau/ref/jenis");
  const { data, error, isLoading, refetch } = useQuery<any[]>({
    queryKey: ["jenis-kmk-options", key],
    queryFn: () => fetcher(key),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes - reference data doesn't change often
    gcTime: 30 * 60 * 1000, // 30 minutes
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

  const mutate = refetch; // For backward compatibility

  return { options, isLoading, error, mutate } as const;
}
