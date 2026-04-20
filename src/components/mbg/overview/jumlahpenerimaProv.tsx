import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/httpClient";

export type PenerimaProvItem = {
  provinsi: string;
  penerimasppg: number;
  persen_penerima: string;
};

type PenerimaProvRow = {
  provinsi: string;
  penerima: number;
  persen_penerima: string;
};

type PenerimaProvResponse = {
  success: boolean;
  data?: MbgPenerimaRankingRow[];
};

type MbgPenerimaRankingRow = {
  nama_provinsi: string;
  penerima_manfaat: number;
  persen_penerima: number;
};

const useJumlahPenerima = () => {
  const [dataPenerima, setDataPenerima] = useState<PenerimaProvItem[]>([]);
  const [loading, setLoading] = useState(false);

  const getData = async () => {
    setLoading(true);

    try {
      const response = await apiClient.get<PenerimaProvResponse>(
        "/dashboard/mbg/penerima-rankings",
      );

      const rows = response?.data ?? [];

      const dataArray = rows.map((item) => ({
        provinsi: item.nama_provinsi,
        penerimasppg: Number(item.penerima_manfaat) || 0,
        persen_penerima: String(item.persen_penerima ?? "0"),
      }));

      setDataPenerima(dataArray);
    } catch (error) {
      console.error("Error fetching jumlah penerima per provinsi:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  return { dataPenerima, loading };
};

export default useJumlahPenerima;
