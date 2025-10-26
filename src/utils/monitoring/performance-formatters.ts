import type { CompressionStats } from "@/types/monitoring";

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const formatMegabytes = (bytes: number): string => {
  return `${Math.round(bytes / 1024 / 1024)}MB`;
};

export const formatPercentage = (value: number): string => {
  return `${Math.round(value * 100)}%`;
};

export const formatResponseTime = (ms: number): string => {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
};

export const formatNumber = (num: number): string => {
  return num.toLocaleString('id-ID');
};

export const getCompressionSavings = (stats: CompressionStats): string => {
  const saved = stats.totalUncompressed - stats.totalCompressed;
  return formatMegabytes(saved);
};

export const getCompressionEfficiency = (ratio: number): 'excellent' | 'good' | 'fair' | 'poor' => {
  if (ratio >= 0.8) return 'excellent';
  if (ratio >= 0.6) return 'good';
  if (ratio >= 0.4) return 'fair';
  return 'poor';
};

export const getCacheHitRateQuality = (hitRate: number): 'excellent' | 'good' | 'fair' | 'poor' => {
  if (hitRate >= 0.9) return 'excellent';
  if (hitRate >= 0.8) return 'good';
  if (hitRate >= 0.6) return 'fair';
  return 'poor';
};

export const getResponseTimeQuality = (avgTime: number): 'excellent' | 'good' | 'fair' | 'poor' => {
  if (avgTime <= 50) return 'excellent';
  if (avgTime <= 100) return 'good';
  if (avgTime <= 300) return 'fair';
  return 'poor';
};

export const getMemoryUsageQuality = (usage: number): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' => {
  if (usage <= 50) return 'excellent';
  if (usage <= 70) return 'good';
  if (usage <= 85) return 'fair';
  if (usage <= 95) return 'poor';
  return 'critical';
};

export const getCpuUsageQuality = (usage: number): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' => {
  if (usage <= 40) return 'excellent';
  if (usage <= 60) return 'good';
  if (usage <= 80) return 'fair';
  if (usage <= 90) return 'poor';
  return 'critical';
};
