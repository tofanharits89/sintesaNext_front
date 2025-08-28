# Dashboard Skeleton Components

Comprehensive loading skeleton components for the Sintesa Finance Dashboard to enhance user experience during content loading.

## Overview

This module provides specialized skeleton components that mimic the layout structure of various dashboard cards with placeholder elements. Each skeleton maintains visual consistency with the dashboard's overall aesthetic and includes smooth pulse animations.

## Available Components

### 1. StatCardSkeleton

**Purpose**: Loading skeleton for StatCard components with icon, label, and value.

**Usage**:
```tsx
import { StatCardSkeleton } from '@/components/ui/dashboard-skeletons';

// Basic usage
<StatCardSkeleton />

// With custom className
<StatCardSkeleton className="w-full md:w-1/3" />

// Conditional rendering
{isLoading ? <StatCardSkeleton /> : <StatCard {...props} />}
```

**Layout Structure**:
- Card container with rounded corners and shadow
- Header with label and icon placeholders
- Value and description/trend placeholders

### 2. QuickStatCardSkeleton

**Purpose**: Loading skeleton for QuickStatCard components with trend badges.

**Usage**:
```tsx
import { QuickStatCardSkeleton } from '@/components/ui/dashboard-skeletons';

// Grid layout example
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {isLoading ? (
    Array.from({ length: 4 }).map((_, i) => (
      <QuickStatCardSkeleton key={i} />
    ))
  ) : (
    quickStats.map(stat => <QuickStatCard key={stat.id} {...stat} />)
  )}
</div>
```

**Layout Structure**:
- Compact card with label and trend badge
- Value placeholder with appropriate sizing

### 3. MapSearchCardSkeleton

**Purpose**: Loading skeleton for MapSearchCard components with search input and map area.

**Usage**:
```tsx
import { MapSearchCardSkeleton } from '@/components/ui/dashboard-skeletons';

// Full-width map card
<div className="col-span-full">
  {isMapLoading ? (
    <MapSearchCardSkeleton className="h-96" />
  ) : (
    <MapSearchCard {...mapProps} />
  )}
</div>
```

**Layout Structure**:
- Card header with title
- Search input and selector placeholders
- Large map area placeholder
- Overlay statistics at the bottom

### 4. StatsRankingCardSkeleton

**Purpose**: Loading skeleton for StatsRankingCard components with top/bottom lists.

**Usage**:
```tsx
import { StatsRankingCardSkeleton } from '@/components/ui/dashboard-skeletons';

// Ranking card with loading state
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {isRankingLoading ? (
    <StatsRankingCardSkeleton />
  ) : (
    <StatsRankingCard data={rankingData} />
  )}
</div>
```

**Layout Structure**:
- Card header with title
- Top 5 section with ranked list items
- Bottom 5 section with ranked list items
- Each item includes rank, name, and value placeholders

### 5. ChartCardSkeleton

**Purpose**: Loading skeleton for PlaceholderChartCard components with chart area.

**Usage**:
```tsx
import { ChartCardSkeleton } from '@/components/ui/dashboard-skeletons';

// Chart card in dashboard grid
<div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
  {isChartLoading ? (
    <ChartCardSkeleton className="col-span-full xl:col-span-1" />
  ) : (
    <ChartCard data={chartData} />
  )}
</div>
```

**Layout Structure**:
- Card header with title and description
- Chart legend placeholders
- Large chart area placeholder
- Footer statistics placeholders

### 6. GenericCardSkeleton

**Purpose**: Flexible skeleton for general card layouts with customizable options.

**Usage**:
```tsx
import { GenericCardSkeleton } from '@/components/ui/dashboard-skeletons';

// Basic card
<GenericCardSkeleton />

// Card with header and description
<GenericCardSkeleton 
  showHeader={true} 
  showDescription={true} 
  contentLines={5}
/>

// Card with footer
<GenericCardSkeleton 
  showHeader={true}
  showFooter={true}
  contentLines={3}
/>
```

**Props**:
- `showHeader?: boolean` - Show header section (default: true)
- `showDescription?: boolean` - Show description under title (default: false)
- `contentLines?: number` - Number of content lines (default: 3)
- `showFooter?: boolean` - Show footer section (default: false)

### 7. FilterCardSkeleton

**Purpose**: Loading skeleton for filter cards with form inputs.

**Usage**:
```tsx
import { FilterCardSkeleton } from '@/components/ui/dashboard-skeletons';

// Filter section
<div className="mb-6">
  {isFilterLoading ? (
    <FilterCardSkeleton />
  ) : (
    <FilterCard onFilterChange={handleFilterChange} />
  )}
</div>
```

### 8. TabsCardSkeleton

**Purpose**: Loading skeleton for tabbed card content.

**Usage**:
```tsx
import { TabsCardSkeleton } from '@/components/ui/dashboard-skeletons';

// Tabbed content card
{isTabsLoading ? (
  <TabsCardSkeleton />
) : (
  <TabsCard tabs={tabsData} />
)}
```

## Complete Dashboard Example

```tsx
import React, { useState, useEffect } from 'react';
import {
  StatCardSkeleton,
  QuickStatCardSkeleton,
  MapSearchCardSkeleton,
  StatsRankingCardSkeleton,
  ChartCardSkeleton,
  FilterCardSkeleton
} from '@/components/ui/dashboard-skeletons';

function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => {
      setDashboardData(mockData);
      setIsLoading(false);
    }, 2000);
  }, []);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        {/* Filter Section */}
        <FilterCardSkeleton />
        
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <QuickStatCardSkeleton key={i} />
          ))}
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Map Card */}
          <div className="xl:col-span-2">
            <MapSearchCardSkeleton className="h-96" />
          </div>
          
          {/* Stats Card */}
          <div className="xl:col-span-1">
            <StatCardSkeleton />
          </div>
          
          {/* Chart Cards */}
          <div className="xl:col-span-2">
            <ChartCardSkeleton />
          </div>
          
          {/* Ranking Card */}
          <div className="xl:col-span-1">
            <StatsRankingCardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Actual dashboard content */}
      <DashboardContent data={dashboardData} />
    </div>
  );
}
```

## Best Practices

### 1. Consistent Loading States
```tsx
// Good: Consistent skeleton usage
{isLoading ? <StatCardSkeleton /> : <StatCard {...props} />}

// Avoid: Mixing different loading indicators
{isLoading ? <div>Loading...</div> : <StatCard {...props} />}
```

### 2. Proper Grid Layouts
```tsx
// Good: Maintain grid structure during loading
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  {isLoading ? (
    Array.from({ length: 3 }).map((_, i) => (
      <StatCardSkeleton key={i} />
    ))
  ) : (
    data.map(item => <StatCard key={item.id} {...item} />)
  )}
</div>
```

### 3. Responsive Design
```tsx
// Good: Responsive skeleton sizing
<QuickStatCardSkeleton className="w-full md:w-1/2 lg:w-1/4" />

// Good: Responsive grid with skeletons
<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
  {isLoading ? (
    Array.from({ length: 6 }).map((_, i) => (
      <GenericCardSkeleton key={i} contentLines={4} />
    ))
  ) : (
    cards.map(card => <Card key={card.id} {...card} />)
  )}
</div>
```

### 4. Loading Duration
```tsx
// Good: Reasonable loading simulation
useEffect(() => {
  setIsLoading(true);
  fetchData()
    .then(data => {
      setData(data);
      setIsLoading(false);
    })
    .catch(() => setIsLoading(false));
}, []);
```

## Customization

### Custom Styling
```tsx
// Add custom classes
<StatCardSkeleton className="bg-blue-50 border-blue-200" />

// Override default spacing
<ChartCardSkeleton className="p-8" />
```

### Animation Control
The skeletons use the default `animate-pulse` class from the base `Skeleton` component. To customize animations:

```css
/* In your global CSS */
.custom-skeleton {
  animation: custom-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes custom-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
```

## Performance Considerations

1. **Lazy Loading**: Use skeletons while implementing lazy loading for heavy components
2. **Staggered Loading**: Consider staggered skeleton appearance for better UX
3. **Memory Usage**: Avoid rendering too many skeleton components simultaneously
4. **Accessibility**: Ensure skeletons are properly labeled for screen readers

## Accessibility

The skeleton components automatically include proper ARIA attributes from the base `Skeleton` component. For additional accessibility:

```tsx
<div role="status" aria-label="Loading dashboard data">
  <StatCardSkeleton />
  <span className="sr-only">Loading dashboard statistics...</span>
</div>
```

## Integration with React Query

```tsx
import { useQuery } from '@tanstack/react-query';
import { StatCardSkeleton } from '@/components/ui/dashboard-skeletons';

function StatsSection() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
  });

  if (error) return <ErrorCard error={error} />;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {isLoading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))
      ) : (
        data?.map(stat => (
          <StatCard key={stat.id} {...stat} />
        ))
      )}
    </div>
  );
}
```

---

**Note**: These skeleton components are designed to work seamlessly with the Sintesa Finance Dashboard's design system and maintain visual consistency across all loading states. 🚀