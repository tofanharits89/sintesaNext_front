import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/httpClient";

export type PenerimaKabItem = {
  provinsi: string;
  kabkota: string;
  penerimakab: number;
  persenpenerimakab: number;
};

type PenerimaKabRow = {
  provinsi: string;
  kabkota: string;
  penerimakab: number;
  persen_penerimakab: number;
};

type PenerimaKabResponse = {
  success: boolean;
  data?: PenerimaKabRow[];
};

const useJumlahPenerimaKab = (prov: string, year: string = "2026") => {
  const [dataPenerimaKab, setDataPenerimaKab] = useState<PenerimaKabItem[]>([]);
  const [loading, setLoading] = useState(false);

  const getData = async () => {
    if (!prov) return;
    setLoading(true);

    try {
      const params = new URLSearchParams({ prov, year });
      const response = await apiClient.get<PenerimaKabResponse>(
        `/dashboard/mbg/penerima-by-regency?${params.toString()}`,
      );

      const rows = response?.data ?? [];

      const dataArray = rows.map((item) => ({
        provinsi: item.provinsi,
        kabkota: item.kabkota,
        penerimakab: Number(item.penerimakab) || 0,
        persenpenerimakab: Number(item.persen_penerimakab) || 0,
      }));

      setDataPenerimaKab(dataArray);
    } catch (error) {
      console.error("Error fetching jumlah penerima per kab/kota:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, [prov, year]);

  return { dataPenerimaKab, loading };
};

export default useJumlahPenerimaKab;
