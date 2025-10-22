import { useState, useCallback } from "react";
import type { TimeRange, MonitoringControlsState } from "@/types/monitoring";

const DEFAULT_REFRESH_INTERVALS: Record<TimeRange, number> = {
  '5m': 10000,  // 10 seconds
  '15m': 30000, // 30 seconds
  '1h': 60000,  // 1 minute
  '6h': 300000, // 5 minutes
  '24h': 600000, // 10 minutes
};

export const useMonitoringControls = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('1h');
  const [refreshInterval, setRefreshInterval] = useState<number>(DEFAULT_REFRESH_INTERVALS['1h']);
  const [isAutoRefresh, setIsAutoRefresh] = useState<boolean>(true);

  const handleTimeRangeChange = useCallback((newTimeRange: TimeRange) => {
    setSelectedTimeRange(newTimeRange);
    setRefreshInterval(DEFAULT_REFRESH_INTERVALS[newTimeRange]);
  }, []);

  const toggleAutoRefresh = useCallback(() => {
    setIsAutoRefresh(prev => !prev);
  }, []);

  const setRefreshIntervalManually = useCallback((interval: number) => {
    setRefreshInterval(interval);
  }, []);

  return {
    selectedTimeRange,
    refreshInterval,
    isAutoRefresh,
    setSelectedTimeRange,
    setRefreshInterval: setRefreshIntervalManually,
    setIsAutoRefresh,
    handleTimeRangeChange,
    toggleAutoRefresh,
  };
};