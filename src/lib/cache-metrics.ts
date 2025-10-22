/**
 * Cache Metrics - Performance monitoring for cache operations
 * Tracks hit/miss ratios, performance metrics, and cache health
 */

export interface CacheStats {
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  totalQueries: number;
  averageQueryTime: number;
  categories: Record<string, {
    hits: number;
    misses: number;
    hitRate: number;
    averageQueryTime: number;
  }>;
}

export interface QueryPerformance {
  queryType: string;
  queryKey: string;
  duration: number;
  timestamp: number;
}

export interface TypeStats {
  hits: number;
  misses: number;
  hitRate: number;
  averageQueryTime: number;
}

export interface HealthStatus {
  status: 'healthy' | 'warning' | 'critical';
  hitRate: number;
  averageQueryTime: number;
  issues: string[];
}



export class CacheMetrics {
  private hits = 0;
  private misses = 0;
  private queryPerformances: QueryPerformance[] = [];
  private categoryStats = new Map<string, {
    hits: number;
    misses: number;
    queryTimes: number[];
  }>();

  /**
   * Record a cache hit
   */
  recordHit(queryType: string, queryKey: string): void {
    this.hits++;
    this.updateCategoryStats(queryType, true);
  }

  /**
   * Record a cache miss
   */
  recordMiss(queryType: string, queryKey: string): void {
    this.misses++;
    this.updateCategoryStats(queryType, false);
  }

  /**
   * Record query performance
   */
  recordQueryPerformance(queryType: string, queryKey: string, startTime: number): void {
    const duration = performance.now() - startTime;
    
    // Only record positive durations (handle edge cases gracefully)
    if (duration < 0) {
      return;
    }
    
    const queryPerf: QueryPerformance = {
      queryType,
      queryKey,
      duration,
      timestamp: Date.now()
    };
    
    this.queryPerformances.push(queryPerf);
    
    // Update category query times
    const categoryData = this.categoryStats.get(queryType);
    if (categoryData) {
      categoryData.queryTimes.push(duration);
    }
  }

  /**
   * Get slowest queries
   */
  getSlowestQueries(limit = 10): QueryPerformance[] {
    return [...this.queryPerformances]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Get stats by query type
   */
  getStatsByType(queryType: string): TypeStats {
    const categoryData = this.categoryStats.get(queryType);
    
    if (!categoryData) {
      return {
        hits: 0,
        misses: 0,
        hitRate: 0,
        averageQueryTime: 0
      };
    }
    
    const total = categoryData.hits + categoryData.misses;
    const hitRate = total > 0 ? categoryData.hits / total : 0;
    const averageQueryTime = categoryData.queryTimes.length > 0
      ? categoryData.queryTimes.reduce((a, b) => a + b, 0) / categoryData.queryTimes.length
      : 0;
    
    return {
      hits: categoryData.hits,
      misses: categoryData.misses,
      hitRate,
      averageQueryTime
    };
  }

  /**
   * Get comprehensive cache statistics
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? this.hits / total : 0;
    
    // Calculate average query time
    const allQueryTimes = this.queryPerformances.map(p => p.duration);
    const averageQueryTime = allQueryTimes.length > 0
      ? allQueryTimes.reduce((a, b) => a + b, 0) / allQueryTimes.length
      : 0;
    
    // Build category statistics
    const categories: Record<string, any> = {};
    for (const [category, data] of this.categoryStats.entries()) {
      const categoryTotal = data.hits + data.misses;
      const categoryHitRate = categoryTotal > 0 ? data.hits / categoryTotal : 0;
      const categoryAvgQueryTime = data.queryTimes.length > 0
        ? data.queryTimes.reduce((a, b) => a + b, 0) / data.queryTimes.length
        : 0;
      
      categories[category] = {
        hits: data.hits,
        misses: data.misses,
        hitRate: categoryHitRate,
        averageQueryTime: categoryAvgQueryTime
      };
    }
    
    return {
      totalHits: this.hits,
      totalMisses: this.misses,
      hitRate,
      totalQueries: this.hits + this.misses,
      averageQueryTime,
      categories
    };
  }

  /**
   * Check cache health status
   */
  getHealthStatus(): HealthStatus {
    const stats = this.getStats();
    const issues: string[] = [];
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    // Check hit rate
    if (stats.hitRate <= 0.1) {
      status = 'critical';
      issues.push(`Very low hit rate: ${Math.round(stats.hitRate * 100)}%`);
    } else if (stats.hitRate < 0.3) {
      status = 'warning';
      issues.push(`Low hit rate: ${Math.round(stats.hitRate * 100)}%`);
    }
    
    // Check query time
    if (stats.averageQueryTime >= 1200) {
      status = 'critical';
      issues.push(`Very slow average query time: ${Math.round(stats.averageQueryTime)}ms`);
    } else if (stats.averageQueryTime > 500) {
      if (status !== 'critical') {
        status = 'warning';
      }
      issues.push(`Slow average query time: ${Math.round(stats.averageQueryTime)}ms`);
    }
    
    // Check if we have enough data (only add warning if very little data)
    if (stats.totalQueries < 5 && status === 'healthy') {
      issues.push('Insufficient data for accurate health assessment.');
    }

    return {
      status,
      hitRate: stats.hitRate,
      averageQueryTime: stats.averageQueryTime,
      issues
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.hits = 0;
    this.misses = 0;
    this.queryPerformances = [];
    this.categoryStats.clear();
  }

  private updateCategoryStats(category: string, isHit: boolean): void {
    if (!this.categoryStats.has(category)) {
      this.categoryStats.set(category, {
        hits: 0,
        misses: 0,
        queryTimes: []
      });
    }
    
    const stats = this.categoryStats.get(category)!;
    if (isHit) {
      stats.hits++;
    } else {
      stats.misses++;
    }
  }
}

// Singleton instance for global cache metrics
export const cacheMetrics = new CacheMetrics();