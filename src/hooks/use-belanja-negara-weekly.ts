"use client";

import { useQuery } from "@tanstack/react-query";
import { apiPath } from "@/lib/config/base-path";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BelanjaNegaraParams {
  tglSd2026?: string;    // cutoff for "s.d. prev-week" col in 2026
  tglAwal2026?: string;  // start of weekly window in 2026
  tglAkhir2026?: string; // end of weekly window in 2026
  tglYoy2025?: string;   // cutoff for YoY comparison in 2025
  tglReal2025?: string;  // cutoff for displayed 2025 realisasi
}

export interface BelanjaNegaraRow {
  uraian: string;
  "Pagu 2025": number | null;
  "Realisasi 2025 (s.d. Mei)": number | null;
  "% Capaian 2025": number | null;
  "APBN 2026": number | null;
  "DIPA 2026": number | null;
  "Realisasi s.d. 24 Apr 2026": number | null;
  "Realisasi 25-29 Apr 2026": number | null;
  "Realisasi s.d. 29 Apr 2026": number | null;
  "% thd APBN": number | null;
  "% thd DIPA": number | null;
  "Sisa Pagu APBN": number | null;
  "Growth YoY (%)": number | null;
}

// ─── Fetcher ──────────────────────────────────────────────────────────────────

async function fetchBelanjaNegara(params: BelanjaNegaraParams): Promise<BelanjaNegaraRow[]> {
  const qs = new URLSearchParams();
  if (params.tglSd2026)    qs.set("tglSd2026",    params.tglSd2026);
  if (params.tglAwal2026)  qs.set("tglAwal2026",  params.tglAwal2026);
  if (params.tglAkhir2026) qs.set("tglAkhir2026", params.tglAkhir2026);
  if (params.tglYoy2025)   qs.set("tglYoy2025",   params.tglYoy2025);
  if (params.tglReal2025)  qs.set("tglReal2025",  params.tglReal2025);

  const url = apiPath(`/weekly/belanja-negara${qs.toString() ? `?${qs}` : ""}`);

  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(60_000),
  });

  const text = await res.text();
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const parsed = JSON.parse(text);
      message = parsed?.message || parsed?.error || message;
    } catch {}
    throw new Error(message);
  }

  if (!text.trim()) return [];
  const parsed = JSON.parse(text);
  return parsed?.data ?? [];
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useBelanjaNegaraWeekly(params: BelanjaNegaraParams, enabled = true) {
  const queryKey = [
    "weekly-belanja-negara",
    params.tglSd2026,
    params.tglAwal2026,
    params.tglAkhir2026,
    params.tglYoy2025,
    params.tglReal2025,
  ];

  const { data, isLoading, error, refetch } = useQuery<BelanjaNegaraRow[]>({
    queryKey,
    queryFn: () => fetchBelanjaNegara(params),
    enabled,
    staleTime: 5 * 60 * 1000,  // 5 min
    refetchOnWindowFocus: false,
  });

  return { data: data ?? [], isLoading, error, refetch } as const;
}
