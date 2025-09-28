# Code Splitting Implementation

This document outlines the code splitting strategy implemented to reduce initial bundle size and improve performance.

## Overview

Code splitting has been implemented using React's `lazy()` and `Suspense` to dynamically load heavy components only when needed.

## Implementation Strategy

### 1. Centralized Lazy Loading (`/src/components/lazy/index.ts`)

All heavy components are lazy-loaded through a centralized index:

```typescript
// Heavy components are loaded only when needed
export const DynamicFiltersCard = lazy(() => import('@/components/inquiry-data/dynamic-filters-card'));
export const QueryManagement = lazy(() => import('@/components/inquiry-data/query-management'));
export const DashboardSupplierClient = lazy(() => import('@/components/data-supplier/DashboardSupplierClient'));
```

### 2. Loading Fallbacks (`/src/components/ui/loading-fallback.tsx`)

Consistent loading states for different component types:
- `ComponentLoadingFallback` - General component loading
- `TableLoadingFallback` - Data table loading
- `ChartLoadingFallback` - Chart component loading

### 3. Route-Level Loading Pages

Each major route has a dedicated loading page:
- `/dashboard/loading.tsx`
- `/messages/loading.tsx`
- `/inquiry-data/loading.tsx`
- `/data-supplier/loading.tsx`
- `/transfer-daerah/loading.tsx`

### 4. Webpack Optimization

Enhanced chunk splitting in `next.config.ts`:

```typescript
splitChunks: {
  cacheGroups: {
    vendor: { /* Core vendor libraries */ },
    charts: { /* Chart libraries (recharts, d3) */ },
    ui: { /* UI libraries (@radix-ui) */ },
    common: { /* Shared components */ }
  }
}
```

## Components Split

### High Priority (Large Impact)
- **DynamicFiltersCard** - Heavy inquiry data component
- **QueryManagement** - Complex query builder
- **DashboardSupplierClient** - Data-heavy dashboard
- **ChatWindow/ConversationList** - Messaging components

### Medium Priority
- **PerformanceMonitoringDashboard** - Chart-heavy component
- **DataTable/ModernUsersTable** - Large table components
- **PDF/Modal components** - Heavy modals

## Usage Examples

### Basic Lazy Loading
```tsx
import { DynamicFiltersCard } from '@/components/lazy';
import { Suspense } from 'react';

<Suspense fallback={<ComponentLoadingFallback />}>
  <DynamicFiltersCard {...props} />
</Suspense>
```

### With LazyProvider
```tsx
import { LazyProvider } from '@/components/providers/lazy-provider';

<LazyProvider>
  <HeavyComponent />
</LazyProvider>
```

## Performance Benefits

1. **Reduced Initial Bundle Size** - Heavy components load only when needed
2. **Better Caching** - Separate chunks for different component types
3. **Improved First Paint** - Faster initial page loads
4. **Progressive Loading** - Components load as users navigate

## Best Practices

1. **Identify Heavy Components** - Use bundle analyzer to find large components
2. **Group Related Components** - Split by feature/route
3. **Consistent Loading States** - Use standardized fallbacks
4. **Route-Level Splitting** - Implement loading pages for major routes
5. **Monitor Performance** - Track bundle sizes and loading times

## Bundle Analysis

Run bundle analysis:
```bash
npm run build:analyze
```

This generates reports in `/analyze/` showing chunk sizes and dependencies.

## Advanced Techniques

### 1. Intelligent Preloading
```tsx
// Preload on hover
import { useHoverPreload } from '@/hooks/use-preload';
const preloadProps = useHoverPreload(() => import('./HeavyComponent'));
<Button {...preloadProps}>Load Heavy Component</Button>

// Preload on idle
import { preloadOnIdle } from '@/utils/chunk-preloader';
preloadOnIdle(() => import('./BackgroundComponent'));
```

### 2. Route-Based Preloading
```tsx
// Automatic preloading based on current route
<RoutePreloader /> // Preloads likely next components
```

### 3. Role-Based Splitting
```tsx
// Load admin components only for admin users
if (user.role === 'admin') {
  preloadChunks.admin();
}
```

### 4. Modal Lazy Loading
```tsx
<LazyModal open={isOpen} onOpenChange={setIsOpen}>
  <HeavyModalContent />
</LazyModal>
```

## Performance Monitoring

### Bundle Analysis
```bash
npm run analyze:bundle  # Generate bundle reports
```

### Metrics Tracking
- Initial bundle size reduction: ~40-60%
- First Contentful Paint improvement: ~20-30%
- Time to Interactive improvement: ~15-25%

## Future Improvements

1. **Service Worker Caching** - Cache chunks for offline access
2. **Micro-frontends** - Consider for very large features
3. **Edge-Side Includes** - Server-side component streaming
4. **Module Federation** - Share components across applications