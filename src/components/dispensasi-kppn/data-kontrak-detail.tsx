"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loading2 } from "../../layout/LoadingTable";
import { Trash2 } from "lucide-react";
import { apiPath } from "@/lib/config/base-path";
import { apiClient } from "@/lib/api/httpClient";

interface DataKontrakDetailProps {
  cek: boolean;
  id: string;
}

interface KontrakDetailData {
  id: string;
  id_dispensasi: string;
  thang: string;
  kdsatker: string;
  kdkppn: string;
  tgpermohonan: string;
  nopermohonan: string;
  nokontrak: string;
  tgkontrak: string;
  nilkontrak: number;
}

export default function DataKontrakDetail({ cek, id }: DataKontrakDetailProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<KontrakDetailData[]>([]);

  useEffect(() => {
    if (cek && id) {
      getData();
    }
  }, [cek, id]);

  const getData = async () => {
    setLoading(true);
    const query = `SELECT a.id,a.id_dispensasi,a.thang,a.kdsatker,a.kdkppn,a.tgpermohonan, a.nopermohonan,a.nokontrak,a.tgkontrak,a.nilkontrak FROM  laporan_2023.dispensasi_kppn_lampiran a WHERE a.id_dispensasi='${id}' GROUP BY a.id ORDER BY id DESC`;
    const encryptedQuery = btoa(query);

    try {
      const response = await fetch(
        apiPath(`/dispensasi/${encryptedQuery}?limit=999999&page=0`),
        {
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result.result);
      setLoading(false);
    } catch (error) {
      toast.error("Terjadi Permasalahan Koneksi atau Server Backend");
      setLoading(false);
    }
  };

  const handleHapus = async (
    id: string,
    kdsatker: string,
    kdkppn: string,
    id_dispensasi: string
  ) => {
    if (confirm("Anda yakin ingin menghapus data ini?")) {
      try {
        await apiClient.delete(`/dispensasi/kontrak/${id}/${id_dispensasi}`);

        toast.success("Data telah dihapus.");
        getData();
      } catch (error) {
        toast.error("Terjadi Permasalahan Koneksi atau Server Backend");
      }
    }
  };

  return (
    <div className="my-2 px-1">
      {loading ? (
        <div className="space-y-4">
          <Loading2 />
          <Loading2 />
          <Loading2 />
        </div>
      ) : (
        <div className="relative w-full overflow-auto rounded-md border">
          <table className="w-full text-sm text-center">
            <thead className="bg-[#343a40] text-white">
              <tr>
                <th className="h-10 px-4 align-middle font-semibold">No</th>
                <th className="h-10 px-4 align-middle font-semibold">
                  Tgl Kontrak
                </th>
                <th className="h-10 px-4 align-middle font-semibold">
                  No Kontrak/ Adendum
                </th>
                <th className="h-10 px-4 align-middle font-semibold">
                  Nilai Kontrak
                </th>
                {user?.role !== "kanwil_djpb" && (
                  <th className="h-10 px-4 align-middle font-semibold">
                    Hapus
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map((row, index) => (
                <tr
                  key={index}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <td className="p-3 align-middle">{index + 1}</td>
                  <td className="p-3 align-middle">{row.tgkontrak}</td>
                  <td className="p-3 align-middle">{row.nokontrak}</td>
                  <td className="p-3 align-middle text-end font-mono">
                    {row.nilkontrak.toLocaleString()}
                  </td>
                  {user?.role !== "kanwil_djpb" && (
                    <td className="p-3 align-middle">
                      <div className="flex justify-center">
                        <Trash2
                          className="h-5 w-5 text-red-600 hover:text-red-800 cursor-pointer transition-colors"
                          onClick={() =>
                            handleHapus(
                              row.id,
                              row.kdsatker,
                              row.kdkppn,
                              row.id_dispensasi
                            )
                          }
                        />
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
