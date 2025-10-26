// Preload critical chunks based on user role/permissions
export const preloadChunks = {
  admin: () => Promise.all([
    import('@/components/ui/modern-users-table'),
    import('@/components/inquiry-data/modals/lihat-sql-modal'),
  ]),
  
  user: () => Promise.all([
    import('@/components/inquiry-data/dynamic-filters-card'),
    import('@/components/messaging/chat-window'),
  ]),
  
  dashboard: () => Promise.all([
    import('@/components/dashboard/PerformanceMonitoringDashboard'),
    import('@/features/mbg/components/MapView'),
  ]),
};

export function preloadForRole(role: string) {
  if (role === 'super_admin' || role === 'co_admin') {
    return preloadChunks.admin();
  }
  return preloadChunks.user();
}

export function preloadOnIdle(importFunc: () => Promise<any>) {
  if (typeof window === 'undefined') return;
  
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => importFunc().catch(() => {}));
  } else {
    setTimeout(() => importFunc().catch(() => {}), 1000);
  }
}
