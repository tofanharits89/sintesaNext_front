"use client";

import useSWR from "swr";
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
  const { data, error, isLoading, mutate } = useSWR<DasarPencabutanItem[]>(
    key,
    fetcher,
    { revalidateOnFocus: false }
  );

  const options = (data || []).map((d) => ({
    value: d.no_kmkcabut,
    label: d.no_kmkcabut,
  }));

  return { items: data || [], options, isLoading, error, mutate } as const;
}
