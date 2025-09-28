"use client";

import { useQuery } from "@tanstack/react-query";
import { backendPath } from "@/lib/backend";

export interface OptionItem {
  value: string;
  label: string;
}

export interface KodeAkunRow {
  akun: string;
  nmakun?: string;
  kdsatker?: string;
  jenis_pmk?: string;
  kriteria?: string;
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

export function useKodeAkunOptions(kriteria?: string) {
  const enabled = Boolean(kriteria);
  const url = kriteria
    ? backendPath(
        `/transfer-daerah/dau/ref/kode-akun?kriteria=${encodeURIComponent(
          kriteria
        )}`
      )
    : null;
  const { data, error, isLoading, refetch } = useQuery<KodeAkunRow[]>({
    queryKey: ["kode-akun-options", kriteria],
    queryFn: () => fetcher(key!),
    enabled: !!key,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  const options: OptionItem[] = (data || [])
    .map((r) => {
      const akun = String(r.akun ?? "");
      if (!akun) return null;
      const nm = String(r.nmakun ?? "");
      return {
        value: akun,
        label: nm ? `${akun} - ${nm}` : akun,
      } as OptionItem;
    })
    .filter(Boolean) as OptionItem[];

  const akunMap = Object.fromEntries(
    (data || [])
      .filter((r) => r && r.akun)
      .map((r) => [
        String(r.akun),
        {
          kdsatker: r.kdsatker || "",
          nmakun: r.nmakun || "",
          jenis_pmk: r.jenis_pmk || "",
          kriteria: r.kriteria || "",
        },
      ])
  ) as Record<
    string,
    { kdsatker: string; nmakun: string; jenis_pmk: string; kriteria: string }
  >;

  const mutate = refetch; // For backward compatibility

  return { options, akunMap, isLoading, error, mutate } as const;
}
