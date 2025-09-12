import { useState, useEffect, useCallback } from "react";
import { http } from "@/lib/httpClient";
import { apiPath } from "@/lib/base-path";

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
    setIsLoading(true);
    setError(null);

    try {
      const resp = await http.get(apiPath(`/analytics/login-stats/weekly`), {
        params: { days },
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
      console.error("Error fetching weekly stats:", err);
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
          limit: limit,
          offset: offset,
        } as any;
        if (startDate) (params as any).startDate = startDate;
        if (endDate) (params as any).endDate = endDate;
        if (userId) (params as any).userId = userId;

        const resp = await http.get(apiPath(`/analytics/login-history`), {
          params,
        });
        const result: LoginHistoryResponse = resp.data;

        if (result?.success) {
          setLoginHistory(result.data || []);
          setPagination({
            currentPage:
              Math.floor(result.pagination.offset / result.pagination.limit) +
              1,
            totalPages: Math.ceil(
              result.pagination.total / result.pagination.limit
            ),
            totalItems: result.pagination.total,
            itemsPerPage: result.pagination.limit,
          });
        } else {
          throw new Error("Failed to fetch login history");
        }
      } catch (err: any) {
        const status = err?.response?.status;
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch login history";
        if (status === 401) setError("Sesi berakhir. Silakan login kembali.");
        else if (status >= 500) setError("Server bermasalah. Coba lagi nanti.");
        else setError(message);
        console.error("Error fetching login history:", err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Auto-fetch weekly stats on mount
  useEffect(() => {
    fetchWeeklyStats();
  }, []);

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
