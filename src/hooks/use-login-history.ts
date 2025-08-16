import { useState, useEffect, useCallback } from 'react';
import { apiPath } from '@/lib/base-path';

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
  fetchLoginHistory: (limit?: number, offset?: number, startDate?: string, endDate?: string, userId?: number) => Promise<void>;
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
      const response = await fetch(apiPath(`/analytics/login-stats/weekly?days=${days}`), {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setWeeklyStats(result.data || []);
      } else {
        throw new Error(result.message || 'Failed to fetch weekly stats');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch weekly stats';
      setError(errorMessage);
      console.error('Error fetching weekly stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLoginHistory = useCallback(async (
    limit: number = 20,
    offset: number = 0,
    startDate?: string,
    endDate?: string,
    userId?: number
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (userId) params.append('userId', userId.toString());

      const response = await fetch(apiPath(`/analytics/login-history?${params}`), {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: LoginHistoryResponse = await response.json();
      
      if (result.success) {
        setLoginHistory(result.data || []);
        setPagination({
          currentPage: Math.floor(result.pagination.offset / result.pagination.limit) + 1,
          totalPages: Math.ceil(result.pagination.total / result.pagination.limit),
          totalItems: result.pagination.total,
          itemsPerPage: result.pagination.limit,
        });
      } else {
        throw new Error('Failed to fetch login history');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch login history';
      setError(errorMessage);
      console.error('Error fetching login history:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

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