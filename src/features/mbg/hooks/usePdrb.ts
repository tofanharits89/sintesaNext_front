import { useQuery } from "@tanstack/react-query";
import {
  getPdrbKategori,
  getPdrbProvinsi,
  getPdrbData,
  type PdrbKategoriData,
  type PdrbProvinsiData,
  type PdrbDataResponse,
} from "@/features/mbg/api/services";
import { createQueryOptions } from "@/lib/config/query-configs";

export function usePdrbKategori(tahun: string) {
  return useQuery<PdrbKategoriData, Error>({
    queryKey: ["owid", "pdrb", "kategori", tahun],
    queryFn: () => getPdrbKategori(tahun),
    ...createQueryOptions<PdrbKategoriData, Error>("financial"),
  });
}

export function usePdrbProvinsi(tahun: string, kdkanwil?: string) {
  return useQuery<PdrbProvinsiData, Error>({
    queryKey: ["owid", "pdrb", "provinsi", tahun, kdkanwil ?? "all"],
    queryFn: () => getPdrbProvinsi(tahun, kdkanwil),
    ...createQueryOptions<PdrbProvinsiData, Error>("financial"),
  });
}

export function usePdrbData(
  provinsi: string[],
  kategori: string,
  tahun: string,
  kdkanwil?: string,
) {
  return useQuery<PdrbDataResponse, Error>({
    queryKey: [
      "owid",
      "pdrb",
      "data",
      tahun,
      kategori,
      kdkanwil ?? "all",
      provinsi.join(","),
    ],
    queryFn: () => getPdrbData(provinsi, kategori, tahun, kdkanwil),
    enabled: provinsi.length > 0 && !!kategori,
    ...createQueryOptions<PdrbDataResponse, Error>("financial"),
  });
}
