import { useState, useEffect } from "react";
import { CarisatkerData } from "@/types/satker";
import { http } from "@/lib/httpClient";

export function useSatkerData(kdsatker?: string) {
  const [data, setData] = useState<CarisatkerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!kdsatker) return;

    const fetchSatkerData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Backend exposes /api/v1/carisatker/:kdsatker (and alias /api/satker without /v1)
        // Our axios baseURL is http://localhost:88/api/v1, so use /carisatker here
        const resp = await http.get(`/carisatker/${kdsatker}`);
        const result = resp.data;
        if (result?.success === false) {
          throw new Error(result?.message || "Failed to fetch satker data");
        }
        setData(result.data || result || null);
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

  return { data, loading, error };
}

export function useSatkerSearch() {
  const [results, setResults] = useState<CarisatkerData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchSatker = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Match backend collection route: /api/v1/carisatker?search=...
      const resp = await http.get(`/carisatker`, { params: { search: searchTerm } });
      const result = resp.data;
      if (result?.success === false) {
        throw new Error(result?.message || "Failed to search satker data");
      }
      setResults(result.data || result || []);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "An error occurred";
      setError(message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return { results, loading, error, searchSatker };
}
