"use client";

import { useQuery } from "@tanstack/react-query";
import { apiPath } from "@/lib/config/base-path";

export interface OptionItem {
  value: string;
  label: string;
}

interface ProyeksiTkdKppnRow {
  kdkppn: string | null;
  nmkppn: string | null;
}

interface ProyeksiTkdSatkerRow {
  kdsatker: string | null;
  nmsatker: string | null;
  kdkppn: string | null;
  nmkppn: string | null;
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
  if (!text.trim()) return [];
  const result = JSON.parse(text);
  return (result?.data ?? result) as any[];
};

export function useProyeksiTkdKppnOptions() {
  const url = apiPath("/transfer-daerah/proyeksi-tkd/ref/kppn");
  const { data, error, isLoading, refetch } = useQuery<ProyeksiTkdKppnRow[]>({
    queryKey: ["proyeksi-tkd-kppn-options", url],
    queryFn: () => fetcher(url),
    refetchOnWindowFocus: false,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const options: OptionItem[] = (data || [])
    .map((r) => {
      const kode = String(r.kdkppn ?? "").trim();
      if (!kode) return null;
      const nama = String(r.nmkppn ?? "").trim();
      return {
        value: kode,
        label: nama ? `${kode} - ${nama}` : kode,
      } as OptionItem;
    })
    .filter(Boolean) as OptionItem[];

  return { options, isLoading, error, mutate: refetch } as const;
}

export function useProyeksiTkdSatkerOptions(kdkppn?: string) {
  const normalizedKdkppn = String(kdkppn || "").trim();
  const url = normalizedKdkppn
    ? apiPath(
        `/transfer-daerah/proyeksi-tkd/ref/satker?kdkppn=${encodeURIComponent(
          normalizedKdkppn
        )}`
      )
    : null;

  const { data, error, isLoading, refetch } = useQuery<ProyeksiTkdSatkerRow[]>({
    queryKey: ["proyeksi-tkd-satker-options", normalizedKdkppn],
    queryFn: () => fetcher(url!),
    enabled: Boolean(url),
    refetchOnWindowFocus: false,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const options: OptionItem[] = (data || [])
    .filter((r) => String(r.nmsatker ?? "").toUpperCase().includes("KPPN"))
    .map((r) => {
      const kode = String(r.kdsatker ?? "").trim();
      if (!kode) return null;
      const nama = String(r.nmsatker ?? "").trim();
      return {
        value: kode,
        label: nama ? `${kode} - ${nama}` : kode,
      } as OptionItem;
    })
    .filter(Boolean) as OptionItem[];

  return { options, isLoading, error, mutate: refetch } as const;
}
