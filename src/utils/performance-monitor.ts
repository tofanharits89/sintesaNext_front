/**
 * Enhanced Performance Monitoring Utilities
 * Real-time performance tracking and optimization tools
 */

import React from 'react'

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface PerformanceStats {
  count: number;
  totalDuration: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  lastDuration: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private stats: Map<string, PerformanceStats> = new Map();
  private observers: PerformanceObserver[] = [];
  private isMonitoring = false;

  constructor() {
    this.setupNativeObservers();
  }

  /**
   * Start monitoring a performance metric
   */
  start(name: string, metadata?: Record<string, any>): () => void {
    const startTime = performance.now();
    const metric: PerformanceMetric = {
      name,
      startTime,
      metadata: metadata || {}
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(metric);

    return () => this.end(name, startTime);
  }

  /**
   * End monitoring a performance metric
   */
  private end(name: string, startTime: number, metadata?: Record<string, any>): void {
    const endTime = performance.now();
    const duration = endTime - startTime;

    const metricList = this.metrics.get(name);
    if (metricList) {
      const metric = metricList.find(m => m.startTime === startTime);
      if (metric) {
        metric.endTime = endTime;
        metric.duration = duration;
        if (metadata) {
          metric.metadata = { ...metric.metadata, ...metadata };
        }
      }
    }

    this.updateStats(name, duration);
    this.logMetric(name, duration);
  }

  /**
   * Update running statistics for a metric
   */
  private updateStats(name: string, duration: number): void {
    const existing = this.stats.get(name) || {
      count: 0,
      totalDuration: 0,
      averageDuration: 0,
      minDuration: Infinity,
      maxDuration: -Infinity,
      lastDuration: 0
    };

    const newStats: PerformanceStats = {
      count: existing.count + 1,
      totalDuration: existing.totalDuration + duration,
      averageDuration: (existing.totalDuration + duration) / (existing.count + 1),
      minDuration: Math.min(existing.minDuration, duration),
      maxDuration: Math.max(existing.maxDuration, duration),
      lastDuration: duration
    };

    this.stats.set(name, newStats);
  }

  /**
   * Log performance metric
   */
  private logMetric(name: string, duration: number): void {
    if (process.env.NODE_ENV === 'development') {
      const threshold = this.getThreshold(name);
      if (duration > threshold) {
        console.warn(`[Performance] Slow operation detected: ${name} took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`);
      } else {
        console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
      }
    }
  }

  /**
   * Get performance threshold for a metric
   */
  private getThreshold(name: string): number {
    const thresholds: Record<string, number> = {
      'render': 16.67, // 60fps
      'api-call': 1000,
      'data-processing': 100,
      'user-interaction': 50,
      'default': 100
    };

    return thresholds[name] || thresholds.default || 100;
  }

  /**
   * Setup native performance observers
   */
  private setupNativeObservers(): void {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Observe navigation timing
      try {
        const navObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              console.log('[Performance] Page load:', {
                domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
                loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
                totalTime: navEntry.loadEventEnd - (navEntry as any).navigationStart || 0
              });
            }
          }
        });
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navObserver);
      } catch (e) {
        console.warn('[Performance] Navigation observer not supported');
      }

      // Observe resource timing
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'resource') {
              const resource = entry as PerformanceResourceTiming;
              if (resource.duration > 1000) { // Log slow resources
                console.warn('[Performance] Slow resource:', {
                  name: resource.name,
                  duration: resource.duration,
                  size: resource.transferSize
                });
              }
            }
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      } catch (e) {
        console.warn('[Performance] Resource observer not supported');
      }
    }
  }

  /**
   * Get statistics for all metrics
   */
  getStats(): Record<string, PerformanceStats> {
    return Object.fromEntries(this.stats);
  }

  /**
   * Get statistics for a specific metric
   */
  getMetricStats(name: string): PerformanceStats | undefined {
    return this.stats.get(name);
  }

  /**
   * Get recent metrics for a specific name
   */
  getRecentMetrics(name: string, limit: number = 10): PerformanceMetric[] {
    const metrics = this.metrics.get(name) || [];
    return metrics
      .filter(m => m.duration !== undefined)
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, limit);
  }

  /**
   * Clear all metrics and stats
   */
  clear(): void {
    this.metrics.clear();
    this.stats.clear();
  }

  /**
   * Legacy methods for backward compatibility
   */
  measurePageLoad: () => void = () => {
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        console.log('Page load time:', perfData.loadEventEnd - perfData.loadEventStart);
      });
    }
  };
  
  measureComponentRender: (componentName: string) => () => void = (componentName: string) => {
    return this.start(`render-${componentName}`);
  };
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Higher-order function to monitor function performance
 */
export function withPerformanceMonitoring<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  name?: string
): (...args: TArgs) => TReturn {
  const functionName = name || fn.name || 'anonymous';
  
  return (...args: TArgs): TReturn => {
    const endTimer = performanceMonitor.start(functionName);
    try {
      const result = fn(...args);
      endTimer();
      return result;
    } catch (error) {
      endTimer();
      throw error;
    }
  };
}

/**
 * Higher-order function to monitor async function performance
 */
export function withAsyncPerformanceMonitoring<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  name?: string
): (...args: TArgs) => Promise<TReturn> {
  const functionName = name || fn.name || 'anonymous-async';
  
  return async (...args: TArgs): Promise<TReturn> => {
    const endTimer = performanceMonitor.start(functionName);
    try {
      const result = await fn(...args);
      endTimer();
      return result;
    } catch (error) {
      endTimer();
      throw error;
    }
  };
}

/**
 * React Hook for performance monitoring
 */
export function usePerformanceMonitor() {
  const startMonitoring = React.useCallback((name: string, metadata?: Record<string, any>) => {
    return performanceMonitor.start(name, metadata);
  }, []);

  const getStats = React.useCallback(() => {
    return performanceMonitor.getStats();
  }, []);

  const getMetricStats = React.useCallback((name: string) => {
    return performanceMonitor.getMetricStats(name);
  }, []);

  const clearMetrics = React.useCallback(() => {
    performanceMonitor.clear();
  }, []);

  return {
    startMonitoring,
    getStats,
    getMetricStats,
    clearMetrics
  };
}

/**
 * Memory usage monitoring
 */
export const memoryMonitor = {
  /**
   * Get current memory usage (if available)
   */
  getCurrentUsage(): any {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      return (performance as any).memory;
    }
    return null;
  },

  /**
   * Log memory usage
   */
  logUsage(): void {
    const memory = this.getCurrentUsage();
    if (memory) {
      console.log('[Memory] Usage:', {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
      });
    }
  },

  /**
   * Check for memory leaks
   */
  checkForLeaks(): boolean {
    const memory = this.getCurrentUsage();
    if (!memory) return false;

    const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    return usageRatio > 0.8; // Alert if using more than 80% of available memory
  }
};

/**
 * Network performance monitoring
 */
export const networkMonitor = {
  /**
   * Monitor API call performance
   */
  monitorApiCall: async <T>(
    url: string,
    fetcher: () => Promise<T>
  ): Promise<T> => {
    const endTimer = performanceMonitor.start(`api-${url}`);
    
    try {
      const result = await fetcher();
      endTimer();
      return result;
    } catch (error) {
      endTimer();
      throw error;
    }
  },

  /**
   * Get network connection information
   */
  getConnectionInfo(): any {
    if (typeof window !== 'undefined' && 'connection' in navigator) {
      return (navigator as any).connection;
    }
    return null;
  }
};

export default performanceMonitor;
