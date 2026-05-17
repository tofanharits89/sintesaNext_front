"use client";

import dynamic from "next/dynamic";

/**
 * Centralized lazy-loaded component registry.
 *
 * Uses `next/dynamic` with `ssr: false` so heavy client-only components
 * (charts, maps, tables, modals, PDF viewers, etc.) are completely skipped
 * on the server. This avoids loading recharts / @visx / leaflet / pdfjs /
 * emoji-picker / etc. into the Node dev process during SSR, which is the
 * biggest contributor to dev-server RAM on this codebase.
 *
 * Consumers must be client components (`"use client"`). Suspense fallbacks
 * are still supported via the `loading` option below or by wrapping with
 * <Suspense> at the call site.
 */

// Inquiry Data Components (Large)
export const DynamicFiltersCard = dynamic(
  () =>
    import("@/components/inquiry-data/dynamic-filters-card").then((m) => ({
      default: m.DynamicFiltersCard,
    })),
  { ssr: false },
);
export const QueryManagement = dynamic(
  () =>
    import("@/components/inquiry-data/query-management").then((m) => ({
      default: m.QueryManagement,
    })),
  { ssr: false },
);
export const EnhancedFilterCard = dynamic(
  () =>
    import("@/components/inquiry-data/enhanced-filter-card").then((m) => ({
      default: m.EnhancedFilterCard,
    })),
  { ssr: false },
);

// Data Supplier Components
export const DashboardSupplierClient = dynamic(
  () => import("@/components/data-supplier/DashboardSupplierClient"),
  { ssr: false },
);
export const SupplierProfileClient = dynamic(
  () => import("@/components/data-supplier/SupplierProfileClient"),
  { ssr: false },
);

// Messaging Components
export const ChatWindow = dynamic(
  () =>
    import("@/components/messaging/chat-window").then((m) => ({
      default: m.ChatWindow,
    })),
  { ssr: false },
);
export const ConversationList = dynamic(
  () =>
    import("@/components/messaging/conversation-list").then((m) => ({
      default: m.ConversationList,
    })),
  { ssr: false },
);

// Transfer Daerah Components (Heavy modals and tabs — pdfjs-dist / react-pdf)
export const DataKmkModal = dynamic(
  () =>
    import("@/components/transfer-daerah/modals/data-kmk-modal").then((m) => ({
      default: m.DataKmkModal,
    })),
  { ssr: false },
);
export const ProyeksiTkdModal = dynamic(
  () =>
    import("@/components/transfer-daerah/modals/proyeksi-tkd-modal").then(
      (m) => ({ default: m.ProyeksiTkdModal }),
    ),
  { ssr: false },
);
export const PdfViewerModal = dynamic(
  () =>
    import("@/components/transfer-daerah/modals/pdf-viewer-modal").then(
      (m) => ({ default: m.PdfViewerModal }),
    ),
  { ssr: false },
);
export const DataKmkTab = dynamic(
  () =>
    import("@/components/transfer-daerah/data-kmk-tab").then((m) => ({
      default: m.DataKmkTab,
    })),
  { ssr: false },
);
export const DataTransaksiTab = dynamic(
  () =>
    import("@/components/transfer-daerah/data-transaksi-tab").then((m) => ({
      default: m.DataTransaksiTab,
    })),
  { ssr: false },
);
export const RekonsiliasiDataTab = dynamic(
  () =>
    import("@/components/transfer-daerah/rekonsilisasi-data-tab").then((m) => ({
      default: m.RekonsiliasiDataTab,
    })),
  { ssr: false },
);

// Dashboard heavy components
export const PerformanceMonitoringDashboard = dynamic(
  () =>
    import("@/components/dashboard/PerformanceMonitoringDashboard").then(
      (m) => ({ default: m.PerformanceMonitoringDashboard }),
    ),
  { ssr: false },
);
export const StatCard = dynamic(
  () =>
    import("@/components/dashboard/StatCard").then((m) => ({
      default: m.StatCard,
    })),
  { ssr: false },
);
export const AuthRequiredCard = dynamic(
  () =>
    import("@/components/dashboard/AuthRequiredCard").then((m) => ({
      default: m.AuthRequiredCard,
    })),
  { ssr: false },
);

// Heavy UI Components
export const DataTable = dynamic(
  () =>
    import("@/components/ui/data-table").then((m) => ({ default: m.DataTable })),
  { ssr: false },
);
export const ModernUsersTable = dynamic(
  () =>
    import("@/components/ui/modern-users-table").then((m) => ({
      default: m.ModernUsersTable,
    })),
  { ssr: false },
);

// Chart components — recharts is heavy, never SSR them
export const MultipleBarChart = dynamic(
  () =>
    import("@/components/ui/multiple-bar-chart").then((m) => ({
      default: m.MultipleBarChartComponent,
    })),
  { ssr: false },
);
export const BarChart = dynamic(
  () =>
    import("@/components/ui/bar-chart").then((m) => ({
      default: m.BarChartComponent,
    })),
  { ssr: false },
);
export const LineChart = dynamic(
  () =>
    import("@/components/ui/line-chart").then((m) => ({
      default: m.LineChartComponent,
    })),
  { ssr: false },
);
export const DonutChart = dynamic(
  () =>
    import("@/components/ui/donut-chart").then((m) => ({
      default: m.DonutChartComponent,
    })),
  { ssr: false },
);

// Skeleton components (lightweight, but kept here to colocate fallbacks)
export const MultipleBarChartSkeleton = dynamic(
  () =>
    import("@/components/ui/dashboard-skeletons").then((m) => ({
      default: m.MultipleBarChartSkeleton,
    })),
  { ssr: false },
);
export const BarChartSkeleton = dynamic(
  () =>
    import("@/components/ui/dashboard-skeletons").then((m) => ({
      default: m.BarChartSkeleton,
    })),
  { ssr: false },
);
export const LineChartSkeleton = dynamic(
  () =>
    import("@/components/ui/dashboard-skeletons").then((m) => ({
      default: m.LineChartSkeleton,
    })),
  { ssr: false },
);

// Modals (Load on demand)
export const TayangModal = dynamic(
  () =>
    import("@/components/inquiry-data/modals/tayang-modal").then((m) => ({
      default: m.TayangModal,
    })),
  { ssr: false },
);
export const WhatsappModal = dynamic(
  () =>
    import("@/components/inquiry-data/modals/whatsapp-modal").then((m) => ({
      default: m.WhatsappModal,
    })),
  { ssr: false },
);
export const SimpanModal = dynamic(
  () =>
    import("@/components/inquiry-data/modals/simpan-modal").then((m) => ({
      default: m.SimpanModal,
    })),
  { ssr: false },
);

// Feature-specific components
export const EpaFilterCard = dynamic(
  () =>
    import("@/components/epa/filter-card").then((m) => ({
      default: m.FilterCard,
    })),
  { ssr: false },
);
export const EpaTabsCard = dynamic(
  () =>
    import("@/components/epa/tabs-card").then((m) => ({ default: m.TabsCard })),
  { ssr: false },
);

// MBG Components (Map heavy — leaflet)
export const MapView = dynamic(
  () =>
    import("@/features/mbg/components/MapView").then((m) => ({
      default: m.MapView,
    })),
  { ssr: false },
);
export const MapStatsOverlay = dynamic(
  () =>
    import("@/components/mbg/MapStatsOverlay").then((m) => ({
      default: m.MapStatsOverlay,
    })),
  { ssr: false },
);

// Monev KKP Components (visx + custom word cloud)
export const KppnContent = dynamic(
  () =>
    import("@/components/monev-kkp/kppn-content").then((m) => ({
      default: m.KppnContent,
    })),
  { ssr: false },
);
export const KanwilContent = dynamic(
  () =>
    import("@/components/monev-kkp/kanwil-content").then((m) => ({
      default: m.KanwilContent,
    })),
  { ssr: false },
);
