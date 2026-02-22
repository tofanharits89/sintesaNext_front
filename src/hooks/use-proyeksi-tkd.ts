"use client";

import { useQuery } from "@tanstack/react-query";
import { apiPath } from "@/lib/config/base-path";

export interface RawProyeksiTkdRow {
  id: number | string;
  keperluan: string | null;
  thang: string | null;
  periode: string | null;
  kdkppn: string | null;
  nmkppn: string | null;
  kdsatker: string | null;
  nmsatker: string | null;
  jenis_tkd: string | null;
  nmjenis: string | null;
  updatedAt: string | Date | null;
  jan?: number | string | null;
  feb?: number | string | null;
  mar?: number | string | null;
  apr?: number | string | null;
  mei?: number | string | null;
  jun?: number | string | null;
  jul?: number | string | null;
  ags?: number | string | null;
  sep?: number | string | null;
  okt?: number | string | null;
  nov?: number | string | null;
  des?: number | string | null;
  keterangan: string | null;
}

interface MonthlyValues {
  januari: string;
  februari: string;
  maret: string;
  april: string;
  mei: string;
  juni: string;
  juli: string;
  agustus: string;
  september: string;
  oktober: string;
  november: string;
  desember: string;
}

export interface ProyeksiTkdRowUi {
  id: string;
  tahun: string;
  periode: string;
  kppn: string;
  kppnSebagaiSatker: string;
  jenisTkd: string;
  jenisTkdCode: string;
  jenisKeperluan: string;
  keperluanRaw: string;
  kdkppnRaw: string;
  kdsatkerRaw: string;
  periodeRaw: string;
  waktuUpdate: Date | null;
  keterangan: string;
  monthlyValues: MonthlyValues;
}

interface UseProyeksiTkdParams {
  thang?: string | number;
  periode?: string;
  kdkppn?: string;
  kdsatker?: string;
  jenis_tkd?: string;
  keperluan?: string;
  limit?: number;
  offset?: number;
}

interface ProyeksiTkdPagination {
  total: number;
  limit: number;
  offset: number;
  currentPage: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
}

interface ProyeksiTkdResponse {
  success?: boolean;
  data: RawProyeksiTkdRow[];
  pagination?: Partial<ProyeksiTkdPagination>;
}

const fetcher = async (url: string) => {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  const resp = await fetch(url, {
    credentials: "include",
    headers,
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });
  const text = await resp.text();

  if (!resp.ok) {
    let msg = `HTTP ${resp.status}`;
    try {
      const j = JSON.parse(text);
      msg = j?.message || j?.error || msg;
    } catch {
      // Keep fallback message.
    }
    throw new Error(msg);
  }

  if (!text.trim()) throw new Error("Empty response from server");
  const result = JSON.parse(text);
  return result;
};

const parseDate = (value: unknown): Date | null => {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export function useProyeksiTkd(params: UseProyeksiTkdParams) {
  const q: string[] = [];
  if (params?.thang !== undefined && params?.thang !== "") {
    q.push(`thang=${encodeURIComponent(String(params.thang))}`);
  }
  if (params?.periode) q.push(`periode=${encodeURIComponent(params.periode)}`);
  if (params?.kdkppn) q.push(`kdkppn=${encodeURIComponent(params.kdkppn)}`);
  if (params?.kdsatker) q.push(`kdsatker=${encodeURIComponent(params.kdsatker)}`);
  if (params?.jenis_tkd) q.push(`jenis_tkd=${encodeURIComponent(params.jenis_tkd)}`);
  if (params?.keperluan) q.push(`keperluan=${encodeURIComponent(params.keperluan)}`);
  if (params?.limit !== undefined) q.push(`limit=${encodeURIComponent(String(params.limit))}`);
  if (params?.offset !== undefined) q.push(`offset=${encodeURIComponent(String(params.offset))}`);

  const key = apiPath(`/transfer-daerah/proyeksi-tkd${q.length ? `?${q.join("&")}` : ""}`);

  const { data, error, isLoading, refetch } = useQuery<ProyeksiTkdResponse>({
    queryKey: ["proyeksi-tkd", params],
    queryFn: () => fetcher(key),
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 10 * 60 * 1000,
  });

  const rows: ProyeksiTkdRowUi[] = (data?.data || []).map((row) => {
    const year = String(row.thang ?? "").trim();
    const periode = String(row.periode ?? "").trim();
    const kdkppn = String(row.kdkppn ?? "").trim();
    const nmkppn = String(row.nmkppn ?? "").trim();
    const kdsatker = String(row.kdsatker ?? "").trim();
    const nmsatker = String(row.nmsatker ?? "").trim();
    const jenisCode = String(row.jenis_tkd ?? "").trim();
    const jenisName = String(row.nmjenis ?? "").trim();
    const keperluan = String(row.keperluan ?? "").trim();

    const kppnLabel = nmkppn ? `${kdkppn} - ${nmkppn}` : kdkppn;
    const satkerLabel = nmsatker ? `${kdsatker} - ${nmsatker}` : kdsatker;
    const jenisLabel =
      jenisCode && jenisName
        ? `${jenisCode} - ${jenisName}`
        : jenisName || jenisCode;

    return {
      id: String(row.id ?? `${kdkppn}-${kdsatker}-${year}-${periode}`),
      tahun: year,
      periode,
      kppn: kppnLabel || "-",
      kppnSebagaiSatker: satkerLabel || "-",
      jenisTkd: jenisLabel || "-",
      jenisTkdCode: jenisCode,
      jenisKeperluan: keperluan || "-",
      keperluanRaw: keperluan,
      kdkppnRaw: kdkppn,
      kdsatkerRaw: kdsatker,
      periodeRaw: periode,
      waktuUpdate: parseDate(row.updatedAt),
      keterangan: String(row.keterangan ?? "").trim(),
      monthlyValues: {
        januari: String(row.jan ?? ""),
        februari: String(row.feb ?? ""),
        maret: String(row.mar ?? ""),
        april: String(row.apr ?? ""),
        mei: String(row.mei ?? ""),
        juni: String(row.jun ?? ""),
        juli: String(row.jul ?? ""),
        agustus: String(row.ags ?? ""),
        september: String(row.sep ?? ""),
        oktober: String(row.okt ?? ""),
        november: String(row.nov ?? ""),
        desember: String(row.des ?? ""),
      },
    };
  });

  const effectiveLimitSource = data?.pagination?.limit ?? params.limit ?? rows.length ?? 0;
  const effectiveLimit = Number(effectiveLimitSource) || 30;
  const effectiveOffset = Number(data?.pagination?.offset ?? params.offset ?? 0) || 0;
  const effectiveTotal =
    Number(data?.pagination?.total ?? effectiveOffset + rows.length) || 0;
  const computedTotalPages = Math.max(
    1,
    Math.ceil((effectiveTotal || 0) / (effectiveLimit || 1))
  );
  const computedCurrentPage = Math.floor(effectiveOffset / (effectiveLimit || 1)) + 1;

  const pagination: ProyeksiTkdPagination = {
    total: effectiveTotal,
    limit: effectiveLimit,
    offset: effectiveOffset,
    currentPage: Number(data?.pagination?.currentPage ?? computedCurrentPage),
    totalPages: Number(data?.pagination?.totalPages ?? computedTotalPages),
    hasPrev: Boolean(data?.pagination?.hasPrev ?? effectiveOffset > 0),
    hasNext: Boolean(
      data?.pagination?.hasNext ?? effectiveOffset + rows.length < effectiveTotal
    ),
  };

  return { rows, pagination, isLoading, error, mutate: refetch } as const;
}
