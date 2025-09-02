"use client";

import useSWR from "swr";
import { backendPath } from "@/lib/backend";
import { getAuthTokenFromCookie } from "@/utils/auth-utils";

export interface OptionItem {
  value: string;
  label: string;
}

const fetcher = async (url: string) => {
  const token = getAuthTokenFromCookie();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const resp = await fetch(url, { credentials: "include", headers, signal: AbortSignal.timeout(20000) });
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
  const key = backendPath("/transfer-daerah/dau/ref/jenis");
  const { data, error, isLoading, mutate } = useSWR<any[]>(key, fetcher, { revalidateOnFocus: false });

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

  return { options, isLoading, error, mutate } as const;
}
