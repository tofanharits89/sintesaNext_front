import { useQuery } from "@tanstack/react-query";
import {
  getPetugasProvinsi,
  getPetugasData,
  type PetugasProvinsiData,
  type PetugasDataResponse,
} from "@/features/mbg/api/services";
import { createQueryOptions } from "@/lib/config/query-configs";

export function usePetugasProvinsi(year: string = "2026", kdkanwil?: string) {
  return useQuery<PetugasProvinsiData, Error>({
    queryKey: ["mbg", "petugas", "provinsi", year, kdkanwil ?? "all"],
    queryFn: () => getPetugasProvinsi(year, kdkanwil),
    ...createQueryOptions<PetugasProvinsiData, Error>("financial"),
  });
}

export function usePetugasData(provinsi: string | null, year: string = "2026", kdkanwil?: string) {
  return useQuery<PetugasDataResponse, Error>({
    queryKey: ["mbg", "petugas", "data", provinsi ?? "", year, kdkanwil ?? "all"],
    queryFn: () => getPetugasData(provinsi!, year, kdkanwil),
    enabled: !!provinsi,
    ...createQueryOptions<PetugasDataResponse, Error>("financial"),
  });
}
