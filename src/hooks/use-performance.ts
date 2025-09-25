import { useEffect, useRef, useCallback } from 'react';
import logger from '@/lib/logger';

interface PerformanceMetrics {
  renderTime: number;
  renderCount: number;
  lastRender: number;
}

interface UsePerformanceOptions {
  componentName?: string;
  logThreshold?: number; // Log if render time exceeds this (ms)
  maxRenders?: number; // Warn if renders exceed this in time window
  timeWindow?: number; // Time window for render counting (ms)
}

export function usePerformance(options: UsePerformanceOptions = {}) {
  const {
    componentName = 'Unknown Component',
    logThreshold = 16, // 16ms = 60fps threshold
    maxRenders = 10,
    timeWindow = 1000,
  } = options;

  const metricsRef = useRef<PerformanceMetrics>({
    renderTime: 0,
    renderCount: 0,
    lastRender: 0,
  });

  const renderStartRef = useRef<number>(0);

  // Start performance measurement
  const startMeasurement = useCallback(() => {
    renderStartRef.current = performance.now();
  }, []);

  // End performance measurement
  const endMeasurement = useCallback(() => {
    const renderTime = performance.now() - renderStartRef.current;
    const now = Date.now();
    
    metricsRef.current.renderTime = renderTime;
    metricsRef.current.renderCount++;
    metricsRef.current.lastRender = now;

    // Log slow renders
    if (renderTime > logThreshold) {
      logger.warn(`Slow render detected in ${componentName}`, {
        renderTime: `${renderTime.toFixed(2)}ms`,
        renderCount: metricsRef.current.renderCount,
      });
    }

    // Check for excessive renders
    if (metricsRef.current.renderCount > maxRenders) {
      const timeSinceFirst = now - (metricsRef.current.lastRender - timeWindow);
      if (timeSinceFirst < timeWindow) {
        logger.warn(`Excessive renders detected in ${componentName}`, {
          renderCount: metricsRef.current.renderCount,
          timeWindow: `${timeWindow}ms`,
          suggestion: 'Consider memoization or dependency optimization',
        });
      }
    }
  }, [componentName, logThreshold, maxRenders, timeWindow]);

  // Auto-measure renders
  useEffect(() => {
    startMeasurement();
    return () => {
      endMeasurement();
    };
  });

  // Get current metrics
  const getMetrics = useCallback(() => ({
    ...metricsRef.current,
  }), []);

  // Reset metrics
  const resetMetrics = useCallback(() => {
    metricsRef.current = {
      renderTime: 0,
      renderCount: 0,
      lastRender: 0,
    };
  }, []);

  return {
    startMeasurement,
    endMeasurement,
    getMetrics,
    resetMetrics,
  };
}

// Hook for measuring async operations
export function useAsyncPerformance() {
  const measureAsync = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> => {
    const start = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - start;
      
      logger.debug(`Async operation completed: ${operationName}`, {
        duration: `${duration.toFixed(2)}ms`,
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      
      logger.error(`Async operation failed: ${operationName}`, error, {
        duration: `${duration.toFixed(2)}ms`,
      });
      
      throw error;
    }
  }, []);

  return { measureAsync };
}

// Hook for Web Vitals monitoring
export function useWebVitals() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Measure Largest Contentful Paint (LCP)
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      logger.info('Web Vitals - LCP', {
        value: `${lastEntry.startTime.toFixed(2)}ms`,
        element: (lastEntry as any).element?.tagName,
      });
    });

    try {
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      // LCP not supported
    }

    // Measure Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      
      if (clsValue > 0.1) { // CLS threshold
        logger.warn('Web Vitals - High CLS detected', {
          value: clsValue.toFixed(4),
          threshold: '0.1',
        });
      }
    });

    try {
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      // CLS not supported
    }

    return () => {
      observer.disconnect();
      clsObserver.disconnect();
    };
  }, []);
}