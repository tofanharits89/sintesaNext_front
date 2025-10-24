import { useQuery } from "@tanstack/react-query";
import type { RekapEpaResponse, RekapEpaFilters } from "@/types/epa-rekap";

const fetcher = async (url: string): Promise<any> => {
  try {
    const response = await fetch(url, {
      credentials: "include",
      signal: AbortSignal.timeout(20000),
    });

    const text = await response.text();
    console.log("[RekapEpaData] Response text:", text);
    
    if (!response.ok) {
      let msg = `HTTP ${response.status}`;
      try {
        const j = JSON.parse(text);
        msg = j?.message || j?.error || msg;
      } catch {}
      throw new Error(msg);
    }

    if (!text.trim()) throw new Error("Empty response from server");
    const result = JSON.parse(text);
    console.log("[RekapEpaData] Parsed result:", result);
    
    // For data endpoints, return the full response object (not just the array)
    // The API returns { success: true, data: [...], total, grandTotal, ... }
    // We need the full structure, not just the array
    if (result?.success && typeof result === 'object') {
      const { success, ...responseData } = result;
      console.log("[RekapEpaData] Returning response data:", responseData);
      return responseData;
    }
    console.log("[RekapEpaData] Returning result as-is:", result);
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

  const url = `/api/epa/rekap/data?${params.toString()}`;

  console.log("[useRekapEpaData] Query URL:", url);

  const query = useQuery<RekapEpaResponse>({
    queryKey: [
      "rekap-epa-data",
    ],
    queryFn: async () => {
      console.log("[useRekapEpaData] Fetching from:", url);
      const response = await fetcher(url);
      console.log("[useRekapEpaData] First fetch got", response.data?.length, "rows, total:", response.total);
      
      // If there are more pages, fetch them all
      if (response.totalPages && response.totalPages > 1) {
        let allData = response.data || [];
        
        for (let pageNum = 2; pageNum <= response.totalPages; pageNum++) {
          const pageParams = new URLSearchParams();
          pageParams.append("page", pageNum.toString());
          pageParams.append("limit", "9999");
          const pageUrl = `/api/epa/rekap/data?${pageParams.toString()}`;
          
          console.log("[useRekapEpaData] Fetching page", pageNum, "from:", pageUrl);
          const pageResponse = await fetcher(pageUrl);
          allData = allData.concat(pageResponse.data || []);
          console.log("[useRekapEpaData] Page", pageNum, "got", pageResponse.data?.length, "rows, total so far:", allData.length);
        }
        
        return { ...response, data: allData };
      }
      
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - data cached for 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  console.log("[useRekapEpaData] isLoading:", query.isLoading, "isFetching:", query.isFetching);
  return { ...query, isFetching: query.isFetching || query.isLoading };
}

export function useRekapEpaFilters() {
  const url = "/api/epa/rekap/filters";

  return useQuery({
    queryKey: ["rekap-epa-filters"],
    queryFn: () => fetcher(url),
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 60 minutes
  });
}
