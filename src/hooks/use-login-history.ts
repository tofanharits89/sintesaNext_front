import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { http } from "@/lib/api/httpClient";
import { apiPath } from "@/lib/config/base-path";

interface LoginStats {
  date: string;
  distinctUsers: number;
  totalLogins: number;
}

interface LoginHistoryEntry {
  id: number;
  userId: number;
  userName: string;
  username: string;
  userRole: string;
  loginTimestamp: string;
  ipAddress: string;
  userAgent: string;
  location?: string | null;
  nmkanwil?: string | null;
  nmkppn?: string | null;
  kdkanwil?: string | null;
  kdkppn?: string | null;
  createdAt: string;
}

interface LoginHistoryResponse {
  success: boolean;
  data: LoginHistoryEntry[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

interface UseLoginHistoryReturn {
  weeklyStats: LoginStats[];
  loginHistory: LoginHistoryEntry[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  } | null;
  isLoading: boolean;
  error: string | null;
  fetchWeeklyStats: (days?: number) => Promise<void>;
  fetchLoginHistory: (
    limit?: number,
    offset?: number,
    startDate?: string,
    endDate?: string,
    userId?: number
  ) => Promise<void>;
}

export const useLoginHistory = (): UseLoginHistoryReturn => {
  const { isAuthenticated } = useAuth();
  const [weeklyStats, setWeeklyStats] = useState<LoginStats[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([]);
  const [pagination, setPagination] = useState<{
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeeklyStats = async (days: number = 7) => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const resp = await http.get(apiPath(`/analytics/login-stats/weekly`), {
        params: { days, _ts: Date.now() },
        headers: { 'X-Bypass-Cache': '1', 'Cache-Control': 'no-cache' },
      });
      const result = resp.data;

      if (result?.success) {
        setWeeklyStats(result.data || []);
      } else {
        throw new Error(result?.message || "Failed to fetch weekly stats");
      }
    } catch (err: any) {
      const status = err?.response?.status;
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to fetch weekly stats";
      // Map some friendly messages
      if (status === 401) setError("Sesi berakhir. Silakan login kembali.");
      else if (status >= 500) setError("Server bermasalah. Coba lagi nanti.");
      else setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLoginHistory = useCallback(
    async (
      limit: number = 20,
      offset: number = 0,
      startDate?: string,
      endDate?: string,
      userId?: number
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const params: Record<string, string | number> = {
          limit,
          offset,
        } as any;
        if (startDate) (params as any).startDate = startDate;
        if (endDate) (params as any).endDate = endDate;
        if (userId) (params as any).userId = String(userId);

        const resp = await http.get(apiPath(`/analytics/login-history`), {
          params: { ...params, _ts: Date.now() },
          headers: { 'X-Bypass-Cache': '1', 'Cache-Control': 'no-cache' },
        });
        const result = resp.data;

        if (result?.success) {
          const entries: LoginHistoryEntry[] = result.data ?? result.items ?? [];
          setLoginHistory(entries);

          const pg = result.pagination ?? {
            total: typeof result.total === 'number' ? result.total : entries.length,
            limit,
            offset,
            hasMore: false,
          };
          setPagination({
            currentPage: Math.floor(Number(pg.offset) / Number(pg.limit)) + 1,
            totalPages: Math.max(1, Math.ceil(Number(pg.total) / Number(pg.limit))),
            totalItems: Number(pg.total) || 0,
            itemsPerPage: Number(pg.limit) || limit,
          });
        } else {
          throw new Error(result?.message || "Failed to fetch login history");
        }
      } catch (err: any) {
        const status = err?.response?.status;
        const message =
          err?.response?.data?.message || err?.message || "Failed to fetch login history";
        if (status === 401) setError("Sesi berakhir. Silakan login kembali.");
        else if (status >= 500) setError("Server bermasalah. Coba lagi nanti.");
        else setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Auto-fetch weekly stats on mount when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchWeeklyStats();
    }
  }, [isAuthenticated]);

  return {
    weeklyStats,
    loginHistory,
    pagination,
    isLoading,
    error,
    fetchWeeklyStats,
    fetchLoginHistory,
  };
};
