import { useState, useEffect, useCallback } from "react";
import { CarisatkerData } from "@/types/satker";
import { apiClient } from "@/lib/api/httpClient";
import { useAuth } from "./useAuth";

export function useSatkerData(kdsatker?: string) {
  const [data, setData] = useState<CarisatkerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!kdsatker) return;

    const fetchSatkerData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Use Next.js basePath-aware API proxy route: /api/satker/[kdsatker]
        const result = await apiClient.get(`/satker/${kdsatker}`);
        if (result?.success === false) {
          throw new Error(result?.message || "Failed to fetch satker data");
        }
        setData((result as any).data || result || null);
      } catch (err: any) {
        const message = err?.response?.data?.message || err?.message || "An error occurred";
        setError(message);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSatkerData();
  }, [kdsatker]);

  // Clear data when user changes (logout/login)
  useEffect(() => {
    setData(null);
    setError(null);
  }, [user?.id]);

  return { data, loading, error };
}

export function useSatkerSearch() {
  const [results, setResults] = useState<CarisatkerData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const searchSatker = useCallback(async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use Next.js basePath-aware API proxy route: /api/satker
      // Add timestamp to prevent any caching
      const timestamp = Date.now();
      const result = await apiClient.get(`/satker`, {
        params: { search: searchTerm, _t: timestamp },
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
      });

      if (result?.success === false) {
        throw new Error(result?.message || "Failed to search satker data");
      }

      // Extract data array from response
      const dataArray = result?.data || [];

      setResults(Array.isArray(dataArray) ? dataArray : []);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "An error occurred";
      setError(message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear results when user changes (logout/login)
  useEffect(() => {
    setResults([]);
    setError(null);
  }, [user?.id]);

  return { results, loading, error, searchSatker };
}
