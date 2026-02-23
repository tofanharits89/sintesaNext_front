"use client";

import { useQuery } from "@tanstack/react-query";
import { apiPath } from "@/lib/config/base-path";

export interface OptionItem {
  value: string;
  label: string;
}

interface ProyeksiTkdSatkerRow {
  kdsatker: string | null;
  nmsatker: string | null;
}

interface UploadLaporanKanwilRow {
  kdkanwil: string | null;
  nmkanwil: string | null;
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
    let message = `HTTP ${resp.status}`;
    try {
      const payload = JSON.parse(text);
      message = payload?.message || payload?.error || message;
    } catch {
      // Use fallback HTTP status message.
    }
    throw new Error(message);
  }

  if (!text.trim()) return [];
  const result = JSON.parse(text);
  return (result?.data ?? result) as any[];
};

const dedupeOptions = (options: OptionItem[]) => {
  const map = new Map<string, OptionItem>();
  for (const option of options) {
    if (!option.value || map.has(option.value)) continue;
    map.set(option.value, option);
  }
  return Array.from(map.values());
};

export function useUploadLaporanKppnSatkerOptions() {
  const url = apiPath("/transfer-daerah/proyeksi-tkd/ref/satker");
  const { data, error, isLoading, refetch } = useQuery<ProyeksiTkdSatkerRow[]>({
    queryKey: ["upload-laporan-kppn-satker-options", url],
    queryFn: () => fetcher(url),
    refetchOnWindowFocus: false,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const options = dedupeOptions(
    (data || [])
      .filter((row) => String(row.nmsatker ?? "").toUpperCase().includes("KPPN"))
      .map((row) => {
        const kode = String(row.kdsatker ?? "").trim();
        if (!kode) return null;
        const nama = String(row.nmsatker ?? "").trim();
        return {
          value: kode,
          label: nama ? `${kode} - ${nama}` : kode,
        } as OptionItem;
      })
      .filter(Boolean) as OptionItem[]
  );

  return { options, isLoading, error, mutate: refetch } as const;
}

export function useUploadLaporanKanwilOptions() {
  const url = apiPath("/transfer-daerah/upload-laporan/ref/kanwil");
  const { data, error, isLoading, refetch } = useQuery<UploadLaporanKanwilRow[]>({
    queryKey: ["upload-laporan-kanwil-options", url],
    queryFn: () => fetcher(url),
    refetchOnWindowFocus: false,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const options = dedupeOptions(
    (data || [])
      .map((row) => {
        const kode = String(row.kdkanwil ?? "").trim();
        if (!kode) return null;
        const nama = String(row.nmkanwil ?? "").trim();
        return {
          value: kode,
          label: nama ? `${kode} - ${nama}` : kode,
        } as OptionItem;
      })
      .filter(Boolean) as OptionItem[]
  );

  return { options, isLoading, error, mutate: refetch } as const;
}

