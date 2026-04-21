import { useQuery } from "@tanstack/react-query";
import {
  getNtpKategori,
  getNtpProvinsi,
  getNtpData,
  type NtpKategoriData,
  type NtpProvinsiData,
  type NtpDataResponse,
} from "@/features/mbg/api/services";
import { createQueryOptions } from "@/lib/config/query-configs";

export function useNtpKategori(tahun: string) {
  return useQuery<NtpKategoriData, Error>({
    queryKey: ["owid", "ntp", "kategori", tahun],
    queryFn: () => getNtpKategori(tahun),
    ...createQueryOptions<NtpKategoriData, Error>("financial"),
  });
}

export function useNtpProvinsi(tahun: string, kdkanwil?: string) {
  return useQuery<NtpProvinsiData, Error>({
    queryKey: ["owid", "ntp", "provinsi", tahun, kdkanwil ?? "all"],
    queryFn: () => getNtpProvinsi(tahun, kdkanwil),
    ...createQueryOptions<NtpProvinsiData, Error>("financial"),
  });
}

export function useNtpData(
  provinsi: string[],
  kategori: string,
  tahun: string,
  kdkanwil?: string,
) {
  return useQuery<NtpDataResponse, Error>({
    queryKey: [
      "owid",
      "ntp",
      "data",
      tahun,
      kategori,
      kdkanwil ?? "all",
      provinsi.join(","),
    ],
    queryFn: () => getNtpData(provinsi, kategori, tahun, kdkanwil),
    enabled: provinsi.length > 0 && !!kategori,
    ...createQueryOptions<NtpDataResponse, Error>("financial"),
  });
}
