import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { apiClient } from "@/lib/httpClient";

export interface SubOutputItem {
  no: number;
  nmsoutput: string;
  kdsoutput: string;
  vol: number;
  realisasiFisik: number;
}

export interface ProgramDataItem {
  id: string;
  title: string;
  code: string;
  pagu: number;
  realisasi: number;
  blokir: number;
  sisaPagu: number;
  subOutputs: SubOutputItem[];
}

export interface ProgramDataResponse {
  success: boolean;
  data: ProgramDataItem[];
  message?: string;
}

export interface UseProgramDataOptions {
  programType: "prioritas" | "strategis";
  year: string;
  enabled?: boolean;
}

export function useProgramData(
  options: UseProgramDataOptions
): UseQueryResult<ProgramDataItem[], Error> {
  const { programType, year, enabled } = options;
  const isClient = typeof window !== "undefined";

  return useQuery<ProgramDataItem[], Error>({
    queryKey: ["program-data", programType, year],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        params.append("programType", programType);
        params.append("year", year);

        const endpoint = `/dashboard/program-data?${params.toString()}`;

        const result = await apiClient.get<ProgramDataResponse>(endpoint);

        if (!result.success) {
          throw new Error(result.message || "Failed to fetch program data");
        }

        return result.data;
      } catch (error: any) {
        console.error("Error fetching program data:", error);
        throw error;
      }
    },
    enabled: isClient && (enabled ?? true),
    staleTime: 12 * 60 * 60 * 1000, // 12 hours to match backend cache
    retry: (failureCount, error) => {
      if (error.message?.includes("Network Error") || error.message?.includes("fetch")) {
        return failureCount < 2;
      }
      return false;
    },
  });
}
