"use client";

import { useState, useEffect } from "react";
import numeral from "numeral";
import { directBackendClient } from "@/lib/api/httpClient";
import queryCache from "./querycache";
import type { FilterParams } from "./pilihan";

interface DipaRow {
  jumlahdipa: number;
  pagu: number;
  realisasi: number;
  blokir: number;
}

interface QueryResult {
  success: boolean;
  data?: DipaRow[];
  error?: string;
}

interface JumlahDipaProps {
  query: string;
  filterParams?: FilterParams;
  onPersentaseChange?: (persen: string) => void;
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-8 w-3/4 rounded-md bg-gray-200 dark:bg-gray-700" />
      <div className="h-4 w-1/2 rounded-md bg-gray-200 dark:bg-gray-700" />
      <div className="h-4 w-2/3 rounded-md bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}

export const JumlahDipa = ({
  query,
  filterParams,
  onPersentaseChange,
}: JumlahDipaProps) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DipaRow[]>([]);

  useEffect(() => {
    if (query) getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    if (data.length > 0) {
      const persen = (data[0]!.realisasi / data[0]!.pagu) * 100;
      onPersentaseChange?.(numeral(persen).format("0,0.00"));
    }
  }, [data, onPersentaseChange]);

  const getData = async () => {
    setLoading(true);

    if (filterParams) {
      const cacheKey = queryCache.generateKey("jumlahdipa", filterParams);
      const cached = queryCache.get<DipaRow[]>(cacheKey);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }
    }

    try {
      const encryptedQuery = btoa(encodeURIComponent(query));
      const result = await directBackendClient.post<QueryResult>(
        "/inquiry-data/query",
        { encryptedQuery, format: "json", pageSize: 10 },
      );

      const rows: DipaRow[] = result?.data ?? [];
      setData(rows);

      if (filterParams) {
        const cacheKey = queryCache.generateKey("jumlahdipa", filterParams);
        queryCache.set(cacheKey, rows);
      }
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSkeleton />;

  if (!data.length) {
    return (
      <div className="flex h-32 flex-col items-center justify-center text-gray-400">
        <span className="text-4xl">😔</span>
        <p className="mt-2 text-sm">Data tidak tersedia</p>
      </div>
    );
  }

  return (
    <>
      <div className="text-center text-2xl font-bold text-blue-700 dark:text-blue-400 animate-in fade-in">
        {numeral(data[0]!.jumlahdipa).format("0,0")}&nbsp;DIPA
      </div>

      <hr className="my-2 border-gray-200 dark:border-gray-700" />

      <div className="space-y-1 text-sm">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-500 dark:text-gray-400">
            PAGU
          </span>
          <span className="font-semibold text-gray-800 dark:text-gray-100">
            {numeral(data[0]!.pagu).format("0,0.00")} T
          </span>
        </div>

        <hr className="border-gray-100 dark:border-gray-800" />

        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-500 dark:text-gray-400">
            REALISASI
          </span>
          <span className="font-semibold text-green-600 dark:text-green-400">
            {numeral(data[0]!.realisasi).format("0,0.00")} T
          </span>
        </div>

        <hr className="border-gray-100 dark:border-gray-800" />

        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-500 dark:text-gray-400">
            BLOKIR
          </span>
          <span className="font-semibold text-red-600 dark:text-red-400">
            {numeral(data[0]!.blokir).format("0,0.00")} T
          </span>
        </div>
      </div>
    </>
  );
};
