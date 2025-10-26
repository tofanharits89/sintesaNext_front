/**
 * Bundle Optimization Utilities
 * Code splitting, lazy loading, and bundle size optimization tools
 */

import React, { lazy, ComponentType, Suspense } from 'react'

// Dynamic import wrapper with error handling
export function dynamicImport<T = any>(
  importFn: () => Promise<T>,
  fallback?: React.ComponentType
): React.LazyExoticComponent<ComponentType<any>> {
  const LazyComponent = lazy(() => 
    importFn().catch(error => {
      console.error('Dynamic import failed:', error)
      // Return a fallback component or throw error
      return Promise.resolve({
        default: () => React.createElement('div', {
          className: "p-4 border border-red-300 rounded-md bg-red-50"
        }, [
          React.createElement('h3', {
            key: 'title',
            className: "text-red-800 font-medium"
          }, 'Failed to load component'),
          React.createElement('p', {
            key: 'message',
            className: "text-red-600 text-sm"
          }, 'Please refresh the page and try again.')
        ])
      } as any)
    })
  )

  if (fallback) {
    return React.lazy(() => Promise.resolve({
      default: (props: any) => React.createElement(
        Suspense,
        { fallback: React.createElement(fallback) },
        React.createElement(LazyComponent, props)
      )
    }))
  }

  return LazyComponent
}

// Preload component
export function preloadComponent(importFn: () => Promise<any>): void {
  importFn().catch(error => {
    console.warn('Component preloading failed:', error)
  })
}

// Component loading states
export const LoadingStates = {
  // Skeleton loaders for different component types
  Table: () => React.createElement('div', { className: "animate-pulse" }, [
    React.createElement('div', { key: 1, className: "h-4 bg-gray-200 rounded w-full mb-2" }),
    React.createElement('div', { key: 2, className: "h-4 bg-gray-200 rounded w-full mb-2" }),
    React.createElement('div', { key: 3, className: "h-4 bg-gray-200 rounded w-3/4" })
  ]),

  Card: () => React.createElement('div', { className: "animate-pulse" }, 
    React.createElement('div', { className: "h-32 bg-gray-200 rounded-lg" })
  ),

  Chart: () => React.createElement('div', { className: "animate-pulse" },
    React.createElement('div', { className: "h-64 bg-gray-200 rounded-lg" })
  ),

  Form: () => React.createElement('div', { className: "animate-pulse space-y-4" }, [
    React.createElement('div', { key: 1, className: "h-10 bg-gray-200 rounded" }),
    React.createElement('div', { key: 2, className: "h-10 bg-gray-200 rounded" }),
    React.createElement('div', { key: 3, className: "h-24 bg-gray-200 rounded" })
  ]),

  List: () => React.createElement('div', { className: "animate-pulse space-y-2" },
    Array.from({ length: 5 }, (_, i) => 
      React.createElement('div', { key: i, className: "h-12 bg-gray-200 rounded" })
    )
  )
}

// Route-based code splitting
export const LazyComponents = {
  // Dashboard components - commented out until components exist
  // Dashboard: dynamicImport(() => import('../components/dashboard/DashboardClient'), LoadingStates.Card),
  // PerformanceMonitoring: dynamicImport(() => import('../components/dashboard/PerformanceMonitoringDashboard'), LoadingStates.Card),
  
  // Data supplier components - commented out until components exist
  // SupplierDashboard: dynamicImport(() => import('../components/data-supplier/DashboardSupplierClient'), LoadingStates.Card),
  // SupplierProfile: dynamicImport(() => import('../components/data-supplier/SupplierProfileClient'), LoadingStates.Card),
  // SupplierContracts: dynamicImport(() => import('../components/data-supplier/SupplierContractsTable'), LoadingStates.Table),
  
  // Auth components - commented out until components exist
  // LoginForm: dynamicImport(() => import('../components/auth/LoginFormSimplified'), LoadingStates.Form),
  
  // UI components (load on demand) - commented out until components exist
  // AlertDialog: dynamicImport(() => import('../components/ui/alert-dialog')),
  // Calendar: dynamicImport(() => import('../components/ui/calendar')),
  // BarChart: dynamicImport(() => import('../components/ui/bar-chart'), LoadingStates.Chart),
}

// Preload critical components
export function preloadCriticalComponents(): void {
  // Preload components likely to be needed soon
  // Commented out until components exist
  // preloadComponent(() => import('../components/dashboard/DashboardClient'))
  // preloadComponent(() => import('../components/data-supplier/DashboardSupplierClient'))
  console.log('Critical component preloading disabled - components not found')
}

// Intersection Observer for lazy loading
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
): boolean {
  const [isIntersecting, setIsIntersecting] = React.useState(false)

  React.useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setIsIntersecting(entry.isIntersecting)
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [ref, options])

  return isIntersecting
}

// Lazy component with intersection observer
export function LazyComponentWithIntersection({
  importFn,
  fallback = LoadingStates.Card,
  rootMargin = '50px',
  ...props
}: {
  importFn: () => Promise<any>
  fallback?: React.ComponentType
  rootMargin?: string
  [key: string]: any
}) {
  const [shouldLoad, setShouldLoad] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  const isIntersecting = useIntersectionObserver(ref as React.RefObject<Element>, { rootMargin })

  React.useEffect(() => {
    if (isIntersecting && !shouldLoad) {
      setShouldLoad(true)
    }
  }, [isIntersecting, shouldLoad])

  const LazyComponent = React.useMemo(() => {
    if (!shouldLoad) return null
    return dynamicImport(importFn, fallback)
  }, [importFn, fallback, shouldLoad])

  if (!shouldLoad) {
    return React.createElement('div', { ref, ...props })
  }

  return LazyComponent ? React.createElement(LazyComponent, props) : null
}

// Bundle analysis utilities
export const bundleAnalyzer = {
  // Get current bundle size estimate
  getBundleSize(): Promise<{ size: number; gzipped: number }> {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && 'performance' in window) {
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
        const jsResources = resources.filter(r => r.name.endsWith('.js'))
        
        const totalSize = jsResources.reduce((sum, resource) => {
          return sum + (resource.transferSize || 0)
        }, 0)

        // Estimate gzipped size (rough approximation)
        const gzippedSize = Math.floor(totalSize * 0.3)

        resolve({ size: totalSize, gzipped: gzippedSize })
      } else {
        resolve({ size: 0, gzipped: 0 })
      }
    })
  },

  // Monitor bundle loading performance
  monitorBundleLoading(): void {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name.includes('.js')) {
            const resource = entry as PerformanceResourceTiming
            console.log('[Bundle] Script loaded:', {
              name: resource.name.split('/').pop(),
              size: resource.transferSize,
              duration: resource.duration,
              cached: resource.transferSize === 0
            })
          }
        }
      })

      observer.observe({ entryTypes: ['resource'] })
    }
  },

  // Get chunk loading information
  getChunkInfo(): Array<{ name: string; size: number; loaded: boolean }> {
    if (typeof window === 'undefined') return []

    const chunks: Array<{ name: string; size: number; loaded: boolean }> = []
    
    // Try to get webpack chunk information
    if ((window as any).__webpack_require__ && (window as any).__webpack_require__.cache) {
      const cache = (window as any).__webpack_require__.cache
      Object.keys(cache).forEach((key) => {
        const chunk = cache[key]
        if (chunk && chunk.exports) {
          chunks.push({
            name: key,
            size: JSON.stringify(chunk.exports).length,
            loaded: true
          })
        }
      })
    }

    return chunks
  }
}

// Resource optimization utilities
export const resourceOptimizer = {
  // Preload critical resources
  preloadResources(resources: Array<{ href: string; as: string }>): void {
    resources.forEach(resource => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = resource.href
      link.as = resource.as
      document.head.appendChild(link)
    })
  },

  // Prefetch resources for next navigation
  prefetchResources(urls: string[]): void {
    urls.forEach(url => {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = url
      document.head.appendChild(link)
    })
  },

  // Optimize images loading
  optimizeImageLoading(): void {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement
              if (img.dataset.src) {
                img.src = img.dataset.src
                img.removeAttribute('data-src')
                imageObserver.unobserve(img)
              }
            }
          })
        },
        { rootMargin: '50px' }
      )

      // Observe all images with data-src
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img)
      })
    }
  }
}

// Performance monitoring for bundle optimization
export function useBundleOptimization() {
  const [bundleStats, setBundleStats] = React.useState<{ size: number; gzipped: number } | null>(null)
  const [chunkInfo, setChunkInfo] = React.useState<Array<{ name: string; size: number; loaded: boolean }>>([])

  React.useEffect(() => {
    // Monitor bundle loading
    bundleAnalyzer.monitorBundleLoading()

    // Get bundle size
    bundleAnalyzer.getBundleSize().then(setBundleStats)
    
    // Get chunk information
    const chunks = bundleAnalyzer.getChunkInfo()
    setChunkInfo(chunks)

    // Preload critical components
    preloadCriticalComponents()

    // Optimize resource loading
    resourceOptimizer.optimizeImageLoading()
  }, [])

  return {
    bundleStats,
    chunkInfo,
    preloadComponent,
    preloadCriticalComponents
  }
}

// Service Worker for caching strategies
export const serviceWorkerManager = {
  // Register service worker for caching
  async register(): Promise<boolean> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        console.log('[SW] Service worker registered:', registration)
        return true
      } catch (error) {
        console.error('[SW] Service worker registration failed:', error)
        return false
      }
    }
    return false
  },

  // Update service worker
  async update(): Promise<boolean> {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        await registration.update()
        return true
      }
    }
    return false
  },

  // Clear service worker cache
  async clearCache(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      )
    }
  }
}

export default {
  dynamicImport,
  preloadComponent,
  LazyComponents,
  LoadingStates,
  useIntersectionObserver,
  LazyComponentWithIntersection,
  bundleAnalyzer,
  resourceOptimizer,
  useBundleOptimization,
  serviceWorkerManager
}
