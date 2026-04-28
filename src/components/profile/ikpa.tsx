"use client";

import { useState, useEffect } from "react";
import numeral from "numeral";
import { directBackendClient } from "@/lib/api/httpClient";
import queryCache from "./querycache";
import type { FilterParams } from "./pilihan";

interface IkpaRow {
  thang: string;
  aspek_kualitas_renc: number;
  aspek_kualitas_pelaksanaan: number;
  aspek_kualitas_hasil: number;
}

interface SelisihRow {
  thang: string;
  selisih_renc: number;
  selisih_pelaksanaan: number;
  selisih_hasil: number;
}

interface QueryResult {
  success: boolean;
  data?: IkpaRow[];
  error?: string;
}

interface IkpaProps {
  query: string;
  kanwil?: string;
  filterParams?: FilterParams;
}

function LoadingRows() {
  return (
    <div className="animate-pulse space-y-2">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="h-6 w-full rounded bg-gray-200 dark:bg-gray-700"
        />
      ))}
    </div>
  );
}

function TrendIcon({ value }: { value: number }) {
  if (value > 0) return <span className="mr-1 text-blue-500">▲</span>;
  return <span className="mr-1 text-red-500">▼</span>;
}

export default function Ikpa({ query, kanwil, filterParams }: IkpaProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<IkpaRow[]>([]);
  const [selisihData, setSelisihData] = useState<SelisihRow[]>([]);

  useEffect(() => {
    if (query) getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    const selisih: SelisihRow[] = [];
    for (let i = 1; i < data.length; i++) {
      selisih.push({
        thang: data[i]!.thang,
        selisih_renc:
          Number(data[i - 1]!.aspek_kualitas_renc) -
          Number(data[i]!.aspek_kualitas_renc),
        selisih_pelaksanaan:
          data[i - 1]!.aspek_kualitas_pelaksanaan -
          data[i]!.aspek_kualitas_pelaksanaan,
        selisih_hasil:
          data[i - 1]!.aspek_kualitas_hasil - data[i]!.aspek_kualitas_hasil,
      });
    }
    setSelisihData(selisih);
  }, [data]);

  const getData = async () => {
    setLoading(true);

    if (filterParams) {
      const cacheKey = queryCache.generateKey("ikpa", filterParams);
      const cached = queryCache.get<IkpaRow[]>(cacheKey);
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
        { encryptedQuery, format: "json", pageSize: 50 },
      );

      const rows: IkpaRow[] = result?.data ?? [];
      setData(rows);

      if (filterParams) {
        const cacheKey = queryCache.generateKey("ikpa", filterParams);
        queryCache.set(cacheKey, rows);
      }
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[275px] overflow-auto rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
      <h6 className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
        Nilai Indikator Pelaksanaan Anggaran
      </h6>

      {loading ? (
        <LoadingRows />
      ) : (
        <table className="w-full text-center text-xs">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="px-2 py-1 font-semibold text-gray-600 dark:text-gray-400">
                TA
              </th>
              <th className="px-2 py-1 font-semibold text-gray-600 dark:text-gray-400">
                PERENCANAAN
              </th>
              <th className="px-2 py-1 font-semibold text-gray-600 dark:text-gray-400">
                EFISIENSI
              </th>
              <th className="px-2 py-1 font-semibold text-gray-600 dark:text-gray-400">
                EFEKTIFITAS
              </th>
              <th className="px-2 py-1 font-semibold text-gray-600 dark:text-gray-400">
                NILAI
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr
                key={index}
                className="border-b border-gray-100 odd:bg-gray-50 dark:border-gray-800 dark:odd:bg-gray-800/40"
              >
                <td className="px-2 py-1">{row.thang}</td>
                <td className="px-2 py-1">{row.aspek_kualitas_renc}</td>
                <td className="px-2 py-1">{row.aspek_kualitas_pelaksanaan}</td>
                <td className="px-2 py-1">{row.aspek_kualitas_hasil}</td>
                <td className="px-2 py-1">-</td>
              </tr>
            ))}

            {selisihData.map((tahun, index) => (
              <tr
                key={`selisih-${index}`}
                className="border-b border-dashed border-gray-100 bg-blue-50/50 dark:border-gray-800 dark:bg-blue-900/10 text-xs"
              >
                <td className="px-2 py-0.5 text-gray-400" />
                <td className="px-2 py-0.5">
                  <TrendIcon value={tahun.selisih_renc} />
                  {numeral(tahun.selisih_renc).format("0.00")}
                </td>
                <td className="px-2 py-0.5">
                  <TrendIcon value={tahun.selisih_pelaksanaan} />
                  {numeral(tahun.selisih_pelaksanaan).format("0.00")}
                </td>
                <td className="px-2 py-0.5">
                  <TrendIcon value={tahun.selisih_hasil} />
                  {numeral(tahun.selisih_hasil).format("0.00")}
                </td>
                <td className="px-2 py-0.5" />
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {kanwil && kanwil !== "00" && (
        <p className="mt-2 text-right text-xs text-gray-400">
          *) data hanya untuk kanwil ybs
        </p>
      )}
    </div>
  );
}
