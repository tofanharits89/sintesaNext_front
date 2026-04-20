import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/httpClient";

type PenerimaProvData = {
  wilnama: string;
  jumlah: number;
  wilkode: string;
};

type DataMapPenerima = Record<string, { data: PenerimaProvData }>;

type PenerimaProvRow = {
  provinsi_kode: string;
  provinsi_nama: string;
  jumlahpenerima: number;
};

type PenerimaProvResponse = {
  success: boolean;
  result?: PenerimaProvRow[];
};

const useJumlahPenerima = (selectedProvince: string) => {
  const [dataMapPenerima, setDataMapPenerima] = useState<DataMapPenerima>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getData = async () => {
      setLoading(true);

      try {
        const response = await apiClient.get<PenerimaProvResponse>(
          "/dashboard/mbg/penerima-by-province",
        );

        const result = response?.result;

        if (!result || result.length === 0) {
          setDataMapPenerima({});
          return;
        }

        const entries = result.map((item) => {
          const wilkode = item.provinsi_kode?.toUpperCase().trim();
          return [
            wilkode,
            {
              data: {
                wilnama: item.provinsi_nama,
                jumlah: Number(item.jumlahpenerima) || 0,
                wilkode,
              },
            },
          ] as [string, { data: PenerimaProvData }];
        });

        setDataMapPenerima(Object.fromEntries(entries));
      } catch (error) {
        console.error("Error fetching jumlah penerima per provinsi:", error);
      } finally {
        setLoading(false);
      }
    };

    getData();
  }, [selectedProvince]);

  return { dataMapPenerima, loading };
};

export default useJumlahPenerima;
