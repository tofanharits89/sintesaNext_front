import React from 'react';
import { logger } from '@/lib/utils/utils';

/**
 * Utility for tracking component renders to detect infinite loops
 */

interface RenderInfo {
  count: number;
  lastRender: number;
  props?: any;
}

const renderCounts = new Map<string, RenderInfo>();

/**
 * Tracks component renders and warns about potential infinite loops
 */
export function trackRender(
  componentName: string,
  props?: any,
  options: {
    maxRenders?: number;
    timeWindow?: number;
    logProps?: boolean;
  } = {}
) {
  const {
    maxRenders = 50,
    timeWindow = 1000, // 1 second
    logProps = false,
  } = options;

  const now = Date.now();
  const existing = renderCounts.get(componentName);

  if (!existing) {
    renderCounts.set(componentName, {
      count: 1,
      lastRender: now,
      props: logProps ? props : undefined,
    });
    return;
  }

  // Reset count if outside time window
  if (now - existing.lastRender > timeWindow) {
    renderCounts.set(componentName, {
      count: 1,
      lastRender: now,
      props: logProps ? props : undefined,
    });
    return;
  }

  // Increment count
  const newCount = existing.count + 1;
  renderCounts.set(componentName, {
    count: newCount,
    lastRender: now,
    props: logProps ? props : undefined,
  });

  // Warn about potential infinite loop
  if (newCount > maxRenders) {
    logger.warn(
      `🔄 Potential infinite loop detected in ${componentName}:`,
      `${newCount} renders in ${timeWindow}ms`
    );
    
    if (logProps && props) {
      logger.warn('Props that might be causing re-renders:', props);
    }
    
    // Reset to prevent spam
    renderCounts.set(componentName, {
      count: 1,
      lastRender: now,
      props: logProps ? props : undefined,
    });
  }
}

/**
 * React hook for tracking renders
 */
export function useRenderTracker(
  componentName: string,
  props?: any,
  options?: Parameters<typeof trackRender>[2]
) {
  if (process.env.NODE_ENV === 'development') {
    trackRender(componentName, props, options);
  }
}

/**
 * Get render statistics for debugging
 */
export function getRenderStats() {
  return Array.from(renderCounts.entries()).map(([name, info]) => ({
    component: name,
    ...info,
  }));
}

/**
 * Clear render tracking data
 */
export function clearRenderStats() {
  renderCounts.clear();
}

/**
 * HOC for automatic render tracking
 */
export function withRenderTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const name = componentName || Component.displayName || Component.name || 'Unknown';
  
  return function TrackedComponent(props: P) {
    useRenderTracker(name, props, { logProps: true });
    return React.createElement(Component, props);
  };
}
