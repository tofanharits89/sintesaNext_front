/**
 * Advanced Query Cache Management
 * Enhanced caching strategies with intelligent invalidation and performance optimization
 */

import React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { QueryClient, QueryKey, Query, QueryState } from '@tanstack/react-query'
import { queryConfigs, queryKeyFactories } from './query-configs'

// Cache entry metadata
interface CacheEntry {
  data: any
  timestamp: number
  accessCount: number
  lastAccessed: number
  ttl: number
  priority: 'low' | 'medium' | 'high'
}

// Cache warming strategies
interface CacheWarmupConfig {
  key: QueryKey
  fetcher: () => Promise<any>
  priority: number
  dependencies?: QueryKey[]
}

class AdvancedQueryCache {
  private queryClient: QueryClient
  private cacheWarmupQueue: CacheWarmupConfig[] = []
  private backgroundRefreshInterval: NodeJS.Timeout | null = null
  private cacheStats = {
    hits: 0,
    misses: 0,
    invalidations: 0,
    warmups: 0
  }

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient
    this.setupBackgroundRefresh()
    this.setupCacheMonitoring()
  }

  /**
   * Setup background refresh for critical data
   */
  private setupBackgroundRefresh(): void {
    // Refresh critical data every 5 minutes
    this.backgroundRefreshInterval = setInterval(() => {
      this.refreshCriticalData()
    }, 5 * 60 * 1000)
  }

  /**
   * Setup cache monitoring and statistics
   */
  private setupCacheMonitoring(): void {
    // Monitor cache events
    this.queryClient.getQueryCache().subscribe({
      onAdd: undefined, // Remove non-existent property
      onUpdate: (query: Query) => {
        console.log(`[Cache] Query updated: ${query.queryKey.join('/')}`)
      },
      onRemove: (query: Query) => {
        console.log(`[Cache] Query removed: ${query.queryKey.join('/')}`)
      }
    } as any)
  }

  /**
   * Refresh critical data in background
   */
  private async refreshCriticalData(): Promise<void> {
    const criticalKeys = [
      queryKeyFactories.user.profile(),
      queryKeyFactories.dashboard.stats(),
      queryKeyFactories.financial.mbg.quickStats()
    ]

    for (const key of criticalKeys) {
      try {
        await this.queryClient.prefetchQuery({
          queryKey: key,
          staleTime: 0, // Force refresh
          gcTime: 1000 // Clean up immediately if not used
        })
      } catch (error) {
        console.warn(`[Cache] Background refresh failed for ${key.join('/')}:`, error)
      }
    }
  }

  /**
   * Add query to warmup queue
   */
  addToWarmupQueue(config: CacheWarmupConfig): void {
    this.cacheWarmupQueue.push(config)
    this.cacheWarmupQueue.sort((a, b) => b.priority - a.priority)
  }

  /**
   * Process warmup queue
   */
  async processWarmupQueue(): Promise<void> {
    const maxConcurrent = 3
    const batch = this.cacheWarmupQueue.splice(0, maxConcurrent)

    await Promise.allSettled(
      batch.map(async (config) => {
        try {
          // Check dependencies first
          if (config.dependencies) {
            await Promise.all(
              config.dependencies.map(dep => 
                this.queryClient.ensureQueryData({
                  queryKey: dep,
                  staleTime: 0
                })
              )
            )
          }

          await this.queryClient.prefetchQuery({
            queryKey: config.key,
            queryFn: config.fetcher,
            ...queryConfigs.static
          })

          this.cacheStats.warmups++
          console.log(`[Cache] Warmed up: ${config.key.join('/')}`)
        } catch (error) {
          console.warn(`[Cache] Warmup failed for ${config.key.join('/')}:`, error)
        }
      })
    )
  }

  /**
   * Intelligent cache invalidation
   */
  invalidateIntelligently(baseKey: QueryKey, reason: 'update' | 'delete' | 'create' = 'update'): void {
    const cache = this.queryClient.getQueryCache()
    const allQueries = cache.getAll()

    // Find related queries
    const relatedQueries = allQueries.filter(query => {
      const queryKey = query.queryKey
      return this.isRelatedQuery(queryKey, baseKey)
    })

    // Group by priority
    const highPriority = relatedQueries.filter(q => this.getQueryPriority(q) === 'high')
    const mediumPriority = relatedQueries.filter(q => this.getQueryPriority(q) === 'medium')
    const lowPriority = relatedQueries.filter(q => this.getQueryPriority(q) === 'low')

    // Invalidate in priority order
    highPriority.forEach(query => {
      this.queryClient.invalidateQueries({ queryKey: query.queryKey })
      this.cacheStats.invalidations++
    })

    // Delay medium priority invalidations
    setTimeout(() => {
      mediumPriority.forEach(query => {
        this.queryClient.invalidateQueries({ queryKey: query.queryKey })
        this.cacheStats.invalidations++
      })
    }, 100)

    // Delay low priority invalidations
    setTimeout(() => {
      lowPriority.forEach(query => {
        this.queryClient.invalidateQueries({ queryKey: query.queryKey })
        this.cacheStats.invalidations++
      })
    }, 500)

    console.log(`[Cache] Intelligent invalidation: ${highPriority.length} high, ${mediumPriority.length} medium, ${lowPriority.length} low priority queries`)
  }

  /**
   * Check if two queries are related
   */
  private isRelatedQuery(queryKey: QueryKey, baseKey: QueryKey): boolean {
    const queryStr = JSON.stringify(queryKey)
    const baseStr = JSON.stringify(baseKey)
    
    // Direct match
    if (queryStr.includes(baseStr)) return true

    // Check for common patterns
    const patterns = [
      /financial.*mbg/,
      /dashboard.*stats/,
      /messaging.*conversations/,
      /user.*profile/
    ]

    return patterns.some(pattern => 
      pattern.test(queryStr) && pattern.test(baseStr)
    )
  }

  /**
   * Get query priority based on key and usage
   */
  private getQueryPriority(query: Query): 'low' | 'medium' | 'high' {
    const key = query.queryKey
    
    // High priority queries
    if (key.includes('auth') || key.includes('user') || key.includes('critical')) {
      return 'high'
    }

    // Medium priority queries
    if (key.includes('dashboard') || key.includes('financial')) {
      return 'medium'
    }

    // Low priority queries
    return 'low'
  }

  /**
   * Prefetch related data
   */
  async prefetchRelated(baseKey: QueryKey): Promise<void> {
    const relatedMappings: Record<string, QueryKey[]> = {
      'auth,user': [
        queryKeyFactories.user.preferences(),
        queryKeyFactories.dashboard.stats()
      ],
      'dashboard,stats': [
        queryKeyFactories.financial.mbg.quickStats(),
        queryKeyFactories.dashboard.charts()
      ],
      'financial,mbg': [
        queryKeyFactories.financial.mbg.charts(),
        queryKeyFactories.financial.mbg.rankings()
      ]
    }

    const baseKeyStr = JSON.stringify(baseKey)
    const relatedKeys = Object.entries(relatedMappings).find(([key]) => 
      baseKeyStr.includes(key)
    )?.[1]

    if (relatedKeys) {
      await Promise.allSettled(
        relatedKeys.map(key => 
          this.queryClient.prefetchQuery({
            queryKey: key,
            staleTime: 30000 // 30 seconds
          })
        )
      )
    }
  }

  /**
   * Optimize cache size
   */
  optimizeCache(): void {
    const cache = this.queryClient.getQueryCache()
    const allQueries = cache.getAll()

    // Remove old unused queries
    const now = Date.now()
    const threshold = 10 * 60 * 1000 // 10 minutes

    allQueries.forEach(query => {
      const state = query.state
      const lastUpdated = state.dataUpdatedAt || 0
      
      if (now - lastUpdated > threshold && !query.getObserversCount()) {
        cache.remove(query)
        console.log(`[Cache] Removed unused query: ${query.queryKey.join('/')}`)
      }
    })
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const cache = this.queryClient.getQueryCache()
    const allQueries = cache.getAll()

    return {
      ...this.cacheStats,
      totalQueries: allQueries.length,
      activeQueries: allQueries.filter(q => q.getObserversCount() > 0).length,
      cacheSize: JSON.stringify(allQueries.map(q => q.state.data)).length,
      hitRate: this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) || 0
    }
  }

  /**
   * Export cache state for persistence
   */
  exportCache(): Record<string, any> {
    const cache = this.queryClient.getQueryCache()
    const allQueries = cache.getAll()

    return {
      timestamp: Date.now(),
      queries: allQueries.map(query => ({
        key: query.queryKey,
        data: query.state.data,
        updatedAt: query.state.dataUpdatedAt,
        staleTime: (query.options as any)?.staleTime || null
      }))
    }
  }

  /**
   * Import cache state
   */
  importCache(cacheState: Record<string, any>): void {
    if (!cacheState.queries) return

    const maxAge = 5 * 60 * 1000 // 5 minutes
    const now = Date.now()

    cacheState.queries.forEach((query: any) => {
      if (now - query.updatedAt < maxAge) {
        this.queryClient.setQueryData(query.key, query.data)
      }
    })
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    if (this.backgroundRefreshInterval) {
      clearInterval(this.backgroundRefreshInterval)
    }
  }
}

// React Hook for advanced cache management
export function useAdvancedQueryCache(queryClient: QueryClient) {
  const cacheManager = React.useMemo(() => 
    new AdvancedQueryCache(queryClient), [queryClient]
  )

  React.useEffect(() => {
    // Process warmup queue on mount
    cacheManager.processWarmupQueue()

    // Setup periodic optimization
    const optimizationInterval = setInterval(() => {
      cacheManager.optimizeCache()
    }, 5 * 60 * 1000) // Every 5 minutes

    return () => {
      clearInterval(optimizationInterval)
      cacheManager.cleanup()
    }
  }, [cacheManager])

  return {
    invalidateIntelligently: cacheManager.invalidateIntelligently.bind(cacheManager),
    prefetchRelated: cacheManager.prefetchRelated.bind(cacheManager),
    addToWarmupQueue: cacheManager.addToWarmupQueue.bind(cacheManager),
    getStats: cacheManager.getStats.bind(cacheManager),
    exportCache: cacheManager.exportCache.bind(cacheManager),
    importCache: cacheManager.importCache.bind(cacheManager)
  }
}

// Enhanced query hooks with advanced caching
export function createEnhancedQuery<TData, TError = Error>(
  key: QueryKey,
  fetcher: () => Promise<TData>,
  configType: keyof typeof queryConfigs = 'user'
) {
  return {
    useQuery: (options?: any) => {
      const queryClient = useQueryClient()
      const cacheManager = useAdvancedQueryCache(queryClient)

      const result = useQuery({
        queryKey: key,
        queryFn: fetcher,
        ...queryConfigs[configType],
        ...options
      })

      // Prefetch related data on success
      React.useEffect(() => {
        if (result.data && !result.isFetching) {
          cacheManager.prefetchRelated(key)
        }
      }, [result.data, result.isFetching, key, cacheManager])

      return result
    },

    prefetch: () => {
      const queryClient = useQueryClient()
      return queryClient.prefetchQuery({
        queryKey: key,
        queryFn: fetcher,
        ...queryConfigs[configType]
      })
    },

    invalidate: () => {
      const queryClient = useQueryClient()
      // Create cache manager instance for invalidation
      const manager = new AdvancedQueryCache(queryClient)
      manager.invalidateIntelligently(key)
    }
  }
}

export { AdvancedQueryCache }
export default AdvancedQueryCache