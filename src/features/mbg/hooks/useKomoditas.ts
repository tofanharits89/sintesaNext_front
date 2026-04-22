import { useQuery } from "@tanstack/react-query";
import {
  getKomoditasKategori,
  getKomoditasProvinsi,
  getKomoditasData,
  type KomoditasKategoriData,
  type KomoditasProvinsiData,
  type KomoditasDataResponse,
} from "@/features/mbg/api/services";
import { createQueryOptions } from "@/lib/config/query-configs";

export function useKomoditasKategori(tahun: string) {
  return useQuery<KomoditasKategoriData, Error>({
    queryKey: ["owid", "komoditas", "kategori", tahun],
    queryFn: () => getKomoditasKategori(tahun),
    ...createQueryOptions<KomoditasKategoriData, Error>("financial"),
  });
}

export function useKomoditasProvinsi(tahun: string, kdkanwil?: string) {
  return useQuery<KomoditasProvinsiData, Error>({
    queryKey: ["owid", "komoditas", "provinsi", tahun, kdkanwil ?? "all"],
    queryFn: () => getKomoditasProvinsi(tahun, kdkanwil),
    ...createQueryOptions<KomoditasProvinsiData, Error>("financial"),
  });
}

export function useKomoditasData(
  provinsi: string[],
  kategori: string,
  tahun: string,
  kdkanwil?: string,
) {
  return useQuery<KomoditasDataResponse, Error>({
    queryKey: [
      "owid",
      "komoditas",
      "data",
      tahun,
      kategori,
      kdkanwil ?? "all",
      provinsi.join(","),
    ],
    queryFn: () => getKomoditasData(provinsi, kategori, tahun, kdkanwil),
    enabled: provinsi.length > 0 && !!kategori,
    ...createQueryOptions<KomoditasDataResponse, Error>("financial"),
  });
}
