import { useState, useEffect } from "react";
import { CarisatkerData } from "@/types/satker";
import { apiPath } from "@/lib/base-path";
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
        const resp = await http.get(apiPath(`/satker/${kdsatker}`));
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
      const resp = await http.get(apiPath(`/satker`), { params: { search: searchTerm } });
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
