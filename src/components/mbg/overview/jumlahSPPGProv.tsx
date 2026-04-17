import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/httpClient";

type SppgProvData = {
  wilnama: string;
  jumlah: number;
  wilkode: string;
};

type DataMap = Record<string, { data: SppgProvData }>;

type SppgProvRow = {
  provinsi_kode: string;
  provinsi_nama: string;
  sppg: number;
};

type SppgProvResponse = {
  success: boolean;
  result?: SppgProvRow[];
};

const useJumlahSppg = () => {
  const [dataMap, setDataMap] = useState<DataMap>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getData = async () => {
      setLoading(true);

      try {
        const response = await apiClient.get<SppgProvResponse>(
          "/dashboard/mbg/sppg-by-province",
        );

        const result = response?.result;

        if (!result || result.length === 0) {
          setDataMap({});
          return;
        }

        const entries = result.map((item) => {
          const wilkode = item.provinsi_kode?.toUpperCase().trim();
          return [
            wilkode,
            {
              data: {
                wilnama: item.provinsi_nama,
                jumlah: Number(item.sppg) || 0,
                wilkode,
              },
            },
          ] as [string, { data: SppgProvData }];
        });

        setDataMap(Object.fromEntries(entries));
      } catch (error) {
        console.error("Error fetching jumlah SPPG per provinsi:", error);
      } finally {
        setLoading(false);
      }
    };

    getData();
  }, []);

  return { dataMap, loading };
};

export default useJumlahSppg;
