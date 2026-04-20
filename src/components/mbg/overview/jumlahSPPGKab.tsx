import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/httpClient";

export type SppgKabItem = {
  provinsi: string;
  kabkota: string;
  jumlahsppg: number;
  persensppgkab: number;
};

type SppgKabRow = {
  provinsi: string;
  kabkota: string;
  jumlahsppg: number;
  persen_sppgkab: number;
};

type SppgKabResponse = {
  success: boolean;
  data?: SppgKabRow[];
};

const useJumlahSppgKab = (prov: string) => {
  const [dataSppgKab, setDataSppgKab] = useState<SppgKabItem[]>([]);
  const [loading, setLoading] = useState(false);

  const getData = async () => {
    if (!prov) return;
    setLoading(true);

    try {
      const params = new URLSearchParams({ prov });
      const response = await apiClient.get<SppgKabResponse>(
        `/dashboard/mbg/sppg-by-regency?${params.toString()}`,
      );

      const rows = response?.data ?? [];

      const dataArray = rows.map((item) => ({
        provinsi: item.provinsi,
        kabkota: item.kabkota,
        jumlahsppg: Number(item.jumlahsppg) || 0,
        persensppgkab: Number(item.persen_sppgkab) || 0,
      }));

      setDataSppgKab(dataArray);
    } catch (error) {
      console.error("Error fetching jumlah SPPG per kab/kota:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, [prov]);

  return { dataSppgKab, loading };
};

export default useJumlahSppgKab;
