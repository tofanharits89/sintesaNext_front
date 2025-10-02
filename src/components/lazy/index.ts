import { lazy } from 'react';

// Inquiry Data Components (Large)
export const DynamicFiltersCard = lazy(() => import('@/components/inquiry-data/dynamic-filters-card').then(m => ({ default: m.DynamicFiltersCard })));
export const QueryManagement = lazy(() => import('@/components/inquiry-data/query-management').then(m => ({ default: m.QueryManagement })));
export const EnhancedFilterCard = lazy(() => import('@/components/inquiry-data/enhanced-filter-card').then(m => ({ default: m.EnhancedFilterCard })));

// Data Supplier Components
export const DashboardSupplierClient = lazy(() => import('@/components/data-supplier/DashboardSupplierClient'));
export const SupplierProfileClient = lazy(() => import('@/components/data-supplier/SupplierProfileClient'));

// Messaging Components
export const ChatWindow = lazy(() => import('@/components/messaging/chat-window').then(m => ({ default: m.ChatWindow })));
export const ConversationList = lazy(() => import('@/components/messaging/conversation-list').then(m => ({ default: m.ConversationList })));

// Transfer Daerah Components (Heavy modals and tabs)
export const DataKmkModal = lazy(() => import('@/components/transfer-daerah/modals/data-kmk-modal').then(m => ({ default: m.DataKmkModal })));
export const ProyeksiTkdModal = lazy(() => import('@/components/transfer-daerah/modals/proyeksi-tkd-modal').then(m => ({ default: m.ProyeksiTkdModal })));
export const PdfViewerModal = lazy(() => import('@/components/transfer-daerah/modals/pdf-viewer-modal').then(m => ({ default: m.PdfViewerModal })));
export const DataKmkTab = lazy(() => import('@/components/transfer-daerah/data-kmk-tab').then(m => ({ default: m.DataKmkTab })));
export const DataTransaksiTab = lazy(() => import('@/components/transfer-daerah/data-transaksi-tab').then(m => ({ default: m.DataTransaksiTab })));
export const RekonsiliasiDataTab = lazy(() => import('@/components/transfer-daerah/rekonsilisasi-data-tab').then(m => ({ default: m.RekonsiliasiDataTab })));

// Chart Components (Heavy libraries)
export const PerformanceMonitoringDashboard = lazy(() => import('@/components/dashboard/PerformanceMonitoringDashboard').then(m => ({ default: m.PerformanceMonitoringDashboard })));
export const StatCard = lazy(() => import('@/components/dashboard/StatCard').then(m => ({ default: m.StatCard })));
export const AuthRequiredCard = lazy(() => import('@/components/dashboard/AuthRequiredCard').then(m => ({ default: m.AuthRequiredCard })));

// Heavy UI Components
export const DataTable = lazy(() => import('@/components/ui/data-table').then(m => ({ default: m.DataTable })));
export const ModernUsersTable = lazy(() => import('@/components/ui/modern-users-table').then(m => ({ default: m.ModernUsersTable })));

// Chart components - dynamically import to avoid SSR issues
export const MultipleBarChart = lazy(() =>
  import('@/components/ui/multiple-bar-chart').then(m => ({ default: m.MultipleBarChartComponent }))
);
export const BarChart = lazy(() =>
  import('@/components/ui/bar-chart').then(m => ({ default: m.BarChartComponent }))
);
export const LineChart = lazy(() =>
  import('@/components/ui/line-chart').then(m => ({ default: m.LineChartComponent }))
);

// Modals (Load on demand)
export const TayangModal = lazy(() => import('@/components/inquiry-data/modals/tayang-modal').then(m => ({ default: m.TayangModal })));
export const WhatsappModal = lazy(() => import('@/components/inquiry-data/modals/whatsapp-modal').then(m => ({ default: m.WhatsappModal })));
export const SimpanModal = lazy(() => import('@/components/inquiry-data/modals/simpan-modal').then(m => ({ default: m.SimpanModal })));

// Feature-specific components
export const EpaFilterCard = lazy(() => import('@/components/epa/filter-card').then(m => ({ default: m.FilterCard })));
export const EpaTabsCard = lazy(() => import('@/components/epa/tabs-card').then(m => ({ default: m.TabsCard })));

// MBG Components (Map heavy)
export const MapView = lazy(() => import('@/features/mbg/components/MapView').then(m => ({ default: m.MapView })));
export const MapStatsOverlay = lazy(() => import('@/components/mbg/MapStatsOverlay').then(m => ({ default: m.MapStatsOverlay })));