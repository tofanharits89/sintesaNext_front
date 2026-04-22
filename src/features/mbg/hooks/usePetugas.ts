import { useQuery } from "@tanstack/react-query";
import {
  getPetugasProvinsi,
  getPetugasData,
  type PetugasProvinsiData,
  type PetugasDataResponse,
} from "@/features/mbg/api/services";
import { createQueryOptions } from "@/lib/config/query-configs";

export function usePetugasProvinsi(kdkanwil?: string) {
  return useQuery<PetugasProvinsiData, Error>({
    queryKey: ["mbg", "petugas", "provinsi", kdkanwil ?? "all"],
    queryFn: () => getPetugasProvinsi(kdkanwil),
    ...createQueryOptions<PetugasProvinsiData, Error>("financial"),
  });
}

export function usePetugasData(provinsi: string | null, kdkanwil?: string) {
  return useQuery<PetugasDataResponse, Error>({
    queryKey: ["mbg", "petugas", "data", provinsi ?? "", kdkanwil ?? "all"],
    queryFn: () => getPetugasData(provinsi!, kdkanwil),
    enabled: !!provinsi,
    ...createQueryOptions<PetugasDataResponse, Error>("financial"),
  });
}
