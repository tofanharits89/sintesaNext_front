# Performance Monitoring Skeletons

This directory contains specialized skeleton loading components for the Performance Monitoring Dashboard (Monitor Performa page).

## Components

### PerformanceMonitoringSkeleton

**Purpose**: Complete loading skeleton for the Performance Monitoring Dashboard that matches the exact structure and layout of the real page.

**Features**:
- Matches MonitoringControls component with Select, Button, Switch, Badge, and text elements
- Matches KeyMetricsCards with StatCard components in 4-grid layout
- Matches TabContent with cards, progress bars, grids, and charts
- Matches TabsList with 5 tab triggers
- Supports dark mode with proper color contrast

**Usage**:
```tsx
import { PerformanceMonitoringSkeleton } from '@/components/monitoring/skeletons/PerformanceMonitoringSkeleton';

// In your loading state
{loading ? <PerformanceMonitoringSkeleton /> : <PerformanceMonitoringDashboard />}
```

**Structure**:
- `MonitoringControlsSkeleton`: Header controls with time range selector, refresh button, auto-refresh switch, health badge, and last updated text
- `KeyMetricsCardsSkeleton`: 4 StatCard components in responsive grid layout
- `TabsListSkeleton`: 5 tab triggers for Cache, Compression, Real-time, Health, and Analytics
- `TabContentSkeleton`: Detailed card layouts with progress bars, grids, and chart placeholders

### Individual Components

You can also use individual skeleton components for more granular control:

```tsx
import { 
  MonitoringControlsSkeleton,
  KeyMetricsCardsSkeleton,
  TabsListSkeleton,
  TabContentSkeleton 
} from '@/components/monitoring/skeletons/PerformanceMonitoringSkeleton';
```

## Design Principles

1. **Pixel-perfect matching**: Each skeleton element corresponds to actual UI components
2. **Responsive layout**: Maintains the same grid and flexbox structure as the real components
3. **Dark mode support**: Uses appropriate background colors for both light and dark themes
4. **Animation**: Includes pulse animation for better loading experience
5. **Performance**: Lightweight and optimized for fast rendering

## Integration

The skeleton is designed to replace the generic loading state in `PerformanceMonitoringDashboard.tsx`:

```tsx
// Before (generic skeleton)
if (metrics.loading && !metrics.metrics) {
  return <GenericLoadingSkeleton />;
}

// After (matching skeleton)
if (metrics.loading && !metrics.metrics) {
  return <PerformanceMonitoringSkeleton />;
}
```

This provides users with a much better loading experience as they can see exactly what the page structure will look like when fully loaded.