import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/httpClient";
import type { RekapEpaResponse, RekapEpaFilters } from "@/types/epa-rekap";

const fetcher = async (url: string): Promise<any> => {
  try {
    // Use apiClient instead of raw fetch to get automatic token refresh on 401
    const result = await apiClient.get<any>(url);
    
    // For data endpoints, return the full response object (not just the array)
    // The API returns { success: true, data: [...], total, grandTotal, ... }
    // We need the full structure, not just the array
    if (result?.success && typeof result === 'object') {
      const { success, ...responseData } = result;
      return responseData;
    }
    return result;
  } catch (error) {
    console.error("[RekapEpaData] Fetcher error:", error);
    throw error;
  }
};

export function useRekapEpaData(
  filters: RekapEpaFilters,
  page: number = 1,
  limit: number = 50
) {
  // Fetch all pages at once for client-side filtering and pagination
  const params = new URLSearchParams();
  params.append("page", "1");
  params.append("limit", "9999"); // Request large limit to get all rows

  const url = `/epa/rekap/data?${params.toString()}`;

  const query = useQuery<RekapEpaResponse>({
    queryKey: [
      "rekap-epa-data",
    ],
    queryFn: async () => {
      const response = await fetcher(url);
      
      // If there are more pages, fetch them all
      if (response.totalPages && response.totalPages > 1) {
        let allData = response.data || [];
        
        for (let pageNum = 2; pageNum <= response.totalPages; pageNum++) {
          const pageParams = new URLSearchParams();
          pageParams.append("page", pageNum.toString());
          pageParams.append("limit", "9999");
          const pageUrl = `/epa/rekap/data?${pageParams.toString()}`;
          
          const pageResponse = await fetcher(pageUrl);
          allData = allData.concat(pageResponse.data || []);
        }
        
        return { ...response, data: allData };
      }
      
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - data cached for 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return { ...query, isFetching: query.isFetching || query.isLoading };
}

export function useRekapEpaFilters() {
  const url = "/epa/rekap/filters";

  return useQuery({
    queryKey: ["rekap-epa-filters"],
    queryFn: () => fetcher(url),
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 60 minutes
  });
}
