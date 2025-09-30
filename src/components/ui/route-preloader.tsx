"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { preloadOnIdle } from '@/utils/chunk-preloader';

const routePreloadMap: Record<string, () => Promise<any>> = {
  '/dashboard': () => import('@/components/dashboard/PerformanceMonitoringDashboard'),
  '/messages': () => import('@/components/messaging/chat-window'),
  '/inquiry-data': () => import('@/components/inquiry-data/dynamic-filters-card'),
  '/inquiry-data/belanja': () => import('@/components/inquiry-data/query-management'),
  '/inquiry-data/tematik': () => import('@/components/inquiry-data/category-mandatory-filters'),
  '/inquiry-data/kontrak': () => import('@/components/inquiry-data/enhanced-filter-card'),
  '/data-supplier': () => import('@/components/data-supplier/DashboardSupplierClient'),
  '/transfer-daerah': () => import('@/components/transfer-daerah/data-kmk-tab'),
  '/transfer-daerah/dau': () => import('@/components/transfer-daerah/data-transaksi-tab'),
  '/epa': () => import('@/components/epa/filter-card'),
  '/makan-bergizi': () => import('@/features/mbg/components/MapView'),
  '/users': () => import('@/components/ui/modern-users-table'),
};

export function RoutePreloader() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    
    // Preload components for current or prefix-matched route
    const preloadFunc =
      routePreloadMap[pathname] ??
      Object.entries(routePreloadMap).find(([prefix]) => pathname.startsWith(prefix))?.[1];

    if (preloadFunc) {
      preloadOnIdle(preloadFunc);
    }

    // Preload likely next routes based on current route
    if (pathname === '/dashboard') {
      preloadOnIdle(() => import('@/components/messaging/chat-window'));
      preloadOnIdle(() => import('@/components/inquiry-data/dynamic-filters-card'));
    } else if (pathname.startsWith('/inquiry-data')) {
      preloadOnIdle(() => import('@/components/inquiry-data/modals/tayang-modal'));
      preloadOnIdle(() => import('@/components/inquiry-data/modals/simpan-modal'));
    } else if (pathname.startsWith('/transfer-daerah')) {
      preloadOnIdle(() => import('@/components/transfer-daerah/modals/data-kmk-modal'));
    }
  }, [pathname]);

  return null;
}
