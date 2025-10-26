"use client";

import Link from "next/link";
import { cn } from "@/lib/utils/utils";
import {
  ChevronDown,
  Menu,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Utensils,
  Building2,
  ClipboardList,
  Receipt,
  Banknote,
  Inbox,
  FileText,
  Info,
  LineChart,
  TrendingUp,
  Users,
  Briefcase,
  CheckCircle,
  Layers,
  Star,
  Coins,
  Send,
  History,
  Calendar,
  CalendarDays,
  CalendarClock,
  User,
  Phone,
  Upload,
  Search,
  Database,
  PieChart,
  TriangleAlert,
  Share2,
} from "lucide-react";
import { useEffect, useRef, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { trackMenuUsage } from "@/hooks/use-menu-usage";
import { useUnifiedAuth } from "@/lib/auth";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";

export type MenuItem = {
  label: string;
  children?: { label: string }[];
};

const defaultMenu: MenuItem[] = [
  {
    label: "Dashboard",
    children: [{ label: "Dashboard Utama" }, { label: "Dashboard Program" }],
  },
  {
    label: "Makan Bergizi",
    children: [
      { label: "Dashboard MBG" },
      { label: "Kertas Kerja" },
      { label: "Outcome" },
    ],
  },
  {
    label: "Data Supplier",
    children: [
      { label: "Dashboard Supplier" },
      { label: "Profil Supplier" },
      { label: "Konsentrasi Supplier" },
      { label: "Deteksi Anomali Supplier" },
      { label: "Klaster Supplier" },
      { label: "Jaringan Supplier" },
    ],
  },
  {
    label: "EPA",
    children: [{ label: "Summary" }, { label: "Rekap EPA" }],
  },
  {
    label: "Spending Review",
    children: [{ label: "Sektor" }, { label: "Rekomendasi" }],
  },
  {
    label: "Transfer Daerah",
    children: [
      { label: "DAU" },
      { label: "Upload Laporan" },
      { label: "Proyeksi TKD" },
    ],
  },
  {
    label: "Inquiry Data",
    children: [
      { label: "Belanja" },
      { label: "Tematik" },
      { label: "Kontrak" },
      { label: "UP/TUP" },
      { label: "Penerimaan PNBP" },
      { label: "RKAKL Detail" },
    ],
  },
  {
    label: "Profil K/L",
    children: [{ label: "Kementerian" }, { label: "Lembaga" }],
  },
  {
    label: "Laporan",
    children: [
      { label: "Bulanan" },
      { label: "Triwulanan" },
      { label: "Tahunan" },
    ],
  },
  {
    label: "Tentang Kita",
    children: [{ label: "Profil" }, { label: "Kontak" }],
  },
];

export function ResponsiveSidebar({
  menu = defaultMenu,
}: {
  menu?: MenuItem[];
}) {
  const [open, setOpen] = useState(false);
  const { user } = useUnifiedAuth();

  // Filter menu based on user role - only admins can see Data Supplier
  const filteredMenu = useMemo(() => {
    if (!user) return menu;

    const isAdmin = user.role === "super_admin" || user.role === "co_admin";

    // If not admin, filter out Data Supplier menu
    if (!isAdmin) {
      return menu.filter((item) => item.label !== "Data Supplier");
    }

    return menu;
  }, [menu, user]);

  // icon resolver for menu labels
  const iconFor = (label: string) => {
    const cls = "h-4 w-4 mr-1.5";
    switch (label) {
      case "Dashboard":
        return (
          <LayoutDashboard
            className={`${cls} text-sky-600 dark:text-sky-400`}
          />
        );
      case "Makan Bergizi":
        return (
          <Utensils
            className={`${cls} text-emerald-600 dark:text-emerald-400`}
          />
        );
      case "Profil K/L":
        return (
          <Building2
            className={`${cls} text-indigo-600 dark:text-indigo-400`}
          />
        );
      case "EPA":
        return (
          <ClipboardList
            className={`${cls} text-amber-600 dark:text-amber-400`}
          />
        );
      case "Spending Review":
        return (
          <Receipt className={`${cls} text-rose-600 dark:text-rose-400`} />
        );
      case "Transfer Daerah":
        return (
          <Banknote className={`${cls} text-lime-600 dark:text-lime-400`} />
        );
      case "Inquiry Data":
        return (
          <Inbox className={`${cls} text-fuchsia-600 dark:text-fuchsia-400`} />
        );
      case "Data Supplier":
        return (
          <Database className={`${cls} text-purple-600 dark:text-purple-400`} />
        );
      case "Laporan":
        return (
          <FileText className={`${cls} text-cyan-600 dark:text-cyan-400`} />
        );
      case "Tentang Kita":
        return (
          <Info className={`${cls} text-neutral-600 dark:text-neutral-300`} />
        );
      default:
        return null;
    }
  };

  // Submenu icon resolver
  const subIconFor = (parent: string, label: string) => {
    const cls = "h-4 w-4 mr-2 text-muted-foreground";
    switch (`${parent}__${label}`) {
      case "Dashboard__Dashboard Utama":
        return <LineChart className={cls} />;
      case "Dashboard__Dashboard Program":
        return <Layers className={cls} />;
      case "Makan Bergizi__Dashboard MBG":
        return <LineChart className={cls} />;
      case "Makan Bergizi__Kertas Kerja":
        return <ClipboardList className={cls} />;
      case "Makan Bergizi__Outcome":
        return <CheckCircle className={cls} />;
      case "Profil K/L__Kementerian":
        return <Users className={cls} />;
      case "Profil K/L__Lembaga":
        return <Building2 className={cls} />;
      case "EPA__Summary":
        return <LineChart className={cls} />;
      case "EPA__Rekap EPA":
        return <Database className={cls} />;
      case "Spending Review__Sektor":
        return <Layers className={cls} />;
      case "Spending Review__Rekomendasi":
        return <Star className={cls} />;
      case "Transfer Daerah__Proyeksi TKD":
        return <TrendingUp className={cls} />;
      case "Transfer Daerah__Upload Laporan":
        return <Upload className={cls} />;
      case "Transfer Daerah__DAU":
        return <Coins className={cls} />;
      case "Inquiry Data__Permintaan":
        return <Send className={cls} />;
      case "Inquiry Data__Riwayat":
        return <History className={cls} />;
      case "Inquiry Data__Belanja":
        return <Database className={cls} />;
      case "Inquiry Data__Tematik":
        return <Database className={cls} />;
      case "Inquiry Data__Kontrak":
        return <Database className={cls} />;
      case "Inquiry Data__UP/TUP":
        return <Database className={cls} />;
      case "Inquiry Data__Penerimaan PNBP":
        return <Database className={cls} />;
      case "Inquiry Data__RKAKL Detail":
        return <Database className={cls} />;
      case "Laporan__Bulanan":
        return <Calendar className={cls} />;
      case "Laporan__Triwulanan":
        return <CalendarClock className={cls} />;
      case "Laporan__Tahunan":
        return <CalendarDays className={cls} />;
      case "Tentang Kita__Profil":
        return <User className={cls} />;
      case "Tentang Kita__Kontak":
        return <Phone className={cls} />;
      case "Data Supplier__Dashboard Supplier":
        return <LineChart className={cls} />;
      case "Data Supplier__Profil Supplier":
        return <Search className={cls} />;
      case "Data Supplier__Konsentrasi Supplier":
        return <PieChart className={cls} />;
      case "Data Supplier__Deteksi Anomali Supplier":
        return <TriangleAlert className={cls} />;
      case "Data Supplier__Klaster Supplier":
        return <Layers className={cls} />;
      case "Data Supplier__Jaringan Supplier":
        return <Share2 className={cls} />;
      default:
        return null;
    }
  };

  // Page-based pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5); // Default items per page
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Calculate items per page based on container width
  const calculateItemsPerPage = () => {
    const container = containerRef.current;
    if (!container) return 4;

    const containerWidth = container.clientWidth;
    const itemWidth = 192; // w-48 = 192px
    const gap = 8; // gap-2 = 8px
    const padding = 32; // px-4 on each side = 16px, plus some buffer
    const buttonSpace = 80; // Space for navigation buttons when visible

    const availableWidth = containerWidth - padding - buttonSpace;
    const itemsWithGaps = Math.floor(availableWidth / (itemWidth + gap));

    return Math.max(3, itemsWithGaps); // Minimum 3 items per page
  };

  // Update items per page on resize
  useEffect(() => {
    const updateItemsPerPage = () => {
      const newItemsPerPage = calculateItemsPerPage();
      setItemsPerPage(newItemsPerPage);
      // Reset to first page if current page would be out of bounds
      const maxPages = Math.ceil(filteredMenu.length / newItemsPerPage);
      if (currentPage >= maxPages) {
        setCurrentPage(0);
      }
    };

    updateItemsPerPage();
    const onResize = () => updateItemsPerPage();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [filteredMenu.length, currentPage]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredMenu.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredMenu.length);
  const currentPageItems = filteredMenu.slice(startIndex, endIndex);

  const canGoLeft = currentPage > 0;
  const canGoRight = currentPage < totalPages - 1;

  const goToPage = (direction: "prev" | "next") => {
    if (direction === "prev" && canGoLeft) {
      setCurrentPage(currentPage - 1);
    } else if (direction === "next" && canGoRight) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <>
      {/* Horizontal menu on lg+ */}
      <nav
        data-sidebar="true"
        className="hidden lg:block sticky top-14 z-30 border-b bg-white dark:bg-card"
      >
        <div ref={containerRef} className="container mx-auto px-4 relative">
          {/* Left pagination button */}
          {canGoLeft && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Halaman sebelumnya"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-transparent hover:bg-accent"
              onClick={() => goToPage("prev")}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}

          {/* Menu items container */}
          <div className="flex justify-center">
            <div className="flex items-center gap-2 h-12 py-0">
              {currentPageItems.map((m) => (
                <DropdownMenu key={m.label}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="gap-1 w-48 justify-center"
                    >
                      <span className="inline-flex items-center">
                        {iconFor(m.label)}
                        <span>{m.label}</span>
                      </span>
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  {m.children?.length ? (
                    <DropdownMenuContent className="w-64">
                      {m.children.map((c) =>
                        c.label === "Dashboard Utama" &&
                        m.label === "Dashboard" ? (
                          <DropdownMenuItem key={c.label} asChild>
                            <Link
                              href="/dashboard/utama"
                              className="flex items-center w-full"
                              onMouseEnter={() => {
                                import(
                                  "@/components/dashboard/PerformanceMonitoringDashboard"
                                );
                              }}
                              onClick={() =>
                                trackMenuUsage({
                                  menu: m.label,
                                  submenu: c.label,
                                  path: "/dashboard/utama",
                                })
                              }
                            >
                              {subIconFor(m.label, c.label)}
                              <span>{c.label}</span>
                            </Link>
                          </DropdownMenuItem>
                        ) : c.label === "Dashboard Program" &&
                          m.label === "Dashboard" ? (
                          <DropdownMenuItem key={c.label} asChild>
                            <Link
                              href="/dashboard/program"
                              className="flex items-center w-full"
                              onMouseEnter={() => {
                                import("@/components/dashboard/ProgramCard");
                              }}
                              onClick={() =>
                                trackMenuUsage({
                                  menu: m.label,
                                  submenu: c.label,
                                  path: "/dashboard/program",
                                })
                              }
                            >
                              {subIconFor(m.label, c.label)}
                              <span>{c.label}</span>
                            </Link>
                          </DropdownMenuItem>
                        ) : c.label === "Kontrak" &&
                          m.label === "Inquiry Data" ? (
                          <DropdownMenuItem key={c.label} asChild>
                            <Link
                              href="/inquiry-data/kontrak"
                              className="flex items-center w-full"
                              onMouseEnter={() => {
                                import(
                                  "@/components/inquiry-data/enhanced-filter-card"
                                );
                              }}
                              onClick={() =>
                                trackMenuUsage({
                                  menu: m.label,
                                  submenu: c.label,
                                  path: "/inquiry-data/kontrak",
                                })
                              }
                            >
                              {subIconFor(m.label, c.label)}
                              <span>{c.label}</span>
                            </Link>
                          </DropdownMenuItem>
                        ) : c.label === "UP/TUP" &&
                          m.label === "Inquiry Data" ? (
                          <DropdownMenuItem key={c.label} asChild>
                            <Link
                              href="/inquiry-data/up-tup"
                              className="flex items-center w-full"
                              onMouseEnter={() => {
                                import(
                                  "@/components/inquiry-data/enhanced-filter-card"
                                );
                              }}
                              onClick={() =>
                                trackMenuUsage({
                                  menu: m.label,
                                  submenu: c.label,
                                  path: "/inquiry-data/up-tup",
                                })
                              }
                            >
                              {subIconFor(m.label, c.label)}
                              <span>{c.label}</span>
                            </Link>
                          </DropdownMenuItem>
                        ) : c.label === "Penerimaan PNBP" &&
                          m.label === "Inquiry Data" ? (
                          <DropdownMenuItem key={c.label} asChild>
                            <Link
                              href="/inquiry-data/penerimaan-pnbp"
                              className="flex items-center w-full"
                              onMouseEnter={() => {
                                import(
                                  "@/components/inquiry-data/enhanced-filter-card"
                                );
                              }}
                              onClick={() =>
                                trackMenuUsage({
                                  menu: m.label,
                                  submenu: c.label,
                                  path: "/inquiry-data/penerimaan-pnbp",
                                })
                              }
                            >
                              {subIconFor(m.label, c.label)}
                              <span>{c.label}</span>
                            </Link>
                          </DropdownMenuItem>
                        ) : c.label === "Dashboard MBG" &&
                          m.label === "Makan Bergizi" ? (
                          <DropdownMenuItem key={c.label} asChild>
                            <Link
                              href="/makan-bergizi/dashboard"
                              className="flex items-center w-full"
                              onMouseEnter={() => {
                                import("@/features/mbg/components/MapView");
                              }}
                              onClick={() =>
                                trackMenuUsage({
                                  menu: m.label,
                                  submenu: c.label,
                                  path: "/makan-bergizi/dashboard",
                                })
                              }
                            >
                              {subIconFor(m.label, c.label)}
                              <span>{c.label}</span>
                            </Link>
                          </DropdownMenuItem>
                        ) : c.label === "Kertas Kerja" &&
                          m.label === "Makan Bergizi" ? (
                          <DropdownMenuItem key={c.label} asChild>
                            <Link
                              href="/makan-bergizi/kertas-kerja"
                              className="flex items-center w-full"
                              onMouseEnter={() => {
                                import("@/features/mbg/components/MapView");
                              }}
                              onClick={() =>
                                trackMenuUsage({
                                  menu: m.label,
                                  submenu: c.label,
                                  path: "/makan-bergizi/kertas-kerja",
                                })
                              }
                            >
                              {subIconFor(m.label, c.label)}
                              <span>{c.label}</span>
                            </Link>
                          </DropdownMenuItem>
                        ) : c.label === "Profil" &&
                          m.label === "Tentang Kita" ? (
                          <DropdownMenuItem key={c.label} asChild>
                            <Link
                              href="/tentang-kita/profil"
                              className="flex items-center w-full"
                              onMouseEnter={() => {}}
                              onClick={() =>
                                trackMenuUsage({
                                  menu: m.label,
                                  submenu: c.label,
                                  path: "/tentang-kita/profil",
                                })
                              }
                            >
                              {subIconFor(m.label, c.label)}
                              <span>{c.label}</span>
                            </Link>
                          </DropdownMenuItem>
                        ) : c.label === "Summary" && m.label === "EPA" ? (
                          <DropdownMenuItem key={c.label} asChild>
                            <Link
                              href="/epa/summary"
                              className="flex items-center w-full"
                              onMouseEnter={() => {
                                import("@/components/epa/filter-card");
                              }}
                              onClick={() =>
                                trackMenuUsage({
                                  menu: m.label,
                                  submenu: c.label,
                                  path: "/epa/summary",
                                })
                              }
                            >
                              {subIconFor(m.label, c.label)}
                              <span>{c.label}</span>
                            </Link>
                          </DropdownMenuItem>
                        ) : c.label === "Rekap EPA" && m.label === "EPA" ? (
                          <DropdownMenuItem key={c.label} asChild>
                            <Link
                              href="/epa/rekap"
                              className="flex items-center w-full"
                              onMouseEnter={() => {
                                import("@/components/epa/rekap-filter-card");
                                import("@/components/epa/rekap-data-table");
                              }}
                              onClick={() =>
                                trackMenuUsage({
                                  menu: m.label,
                                  submenu: c.label,
                                  path: "/epa/rekap",
                                })
                              }
                            >
                              {subIconFor(m.label, c.label)}
                              <span>{c.label}</span>
                            </Link>
                          </DropdownMenuItem>
                        ) : c.label === "Proyeksi TKD" &&
                          m.label === "Transfer Daerah" ? (
                          <DropdownMenuItem key={c.label} asChild>
                            <Link
                              href="/transfer-daerah/proyeksi-tkd"
                              className="flex items-center w-full"
                              onMouseEnter={() => {
                                import(
                                  "@/components/transfer-daerah/data-kmk-tab"
                                );
                              }}
                              onClick={() =>
                                trackMenuUsage({
                                  menu: m.label,
                                  submenu: c.label,
                                  path: "/transfer-daerah/proyeksi-tkd",
                                })
                              }
                            >
                              {subIconFor(m.label, c.label)}
                              <span>{c.label}</span>
                            </Link>
                          </DropdownMenuItem>
                        ) : c.label === "Upload Laporan" &&
                          m.label === "Transfer Daerah" ? (
                          <DropdownMenuItem key={c.label} asChild>
                            <Link
                              href="/transfer-daerah/upload-laporan"
                              className="flex items-center w-full"
                              onMouseEnter={() => {
                                import(
                                  "@/components/transfer-daerah/data-kmk-tab"
                                );
                              }}
                              onClick={() =>
                                trackMenuUsage({
                                  menu: m.label,
                                  submenu: c.label,
                                  path: "/transfer-daerah/upload-laporan",
                                })
                              }
                            >
                              {subIconFor(m.label, c.label)}
                              <span>{c.label}</span>
                            </Link>
                          </DropdownMenuItem>
                        ) : c.label === "DAU" &&
                          m.label === "Transfer Daerah" ? (
                          <DropdownMenuItem key={c.label} asChild>
                            <Link
                              href="/transfer-daerah/dau"
                              className="flex items-center w-full"
                              onMouseEnter={() => {
                                import(
                                  "@/components/transfer-daerah/data-transaksi-tab"
                                );
                              }}
                              onClick={() =>
                                trackMenuUsage({
                                  menu: m.label,
                                  submenu: c.label,
                                  path: "/transfer-daerah/dau",
                                })
                              }
                            >
                              {subIconFor(m.label, c.label)}
                              <span>{c.label}</span>
                            </Link>
                          </DropdownMenuItem>
                        ) : c.label === "Belanja" &&
                          m.label === "Inquiry Data" ? (
                          <DropdownMenuItem key={c.label} asChild>
                            <Link
                              href="/inquiry-data/belanja"
                              className="flex items-center w-full"
                              onMouseEnter={() => {
                                import(
                                  "@/components/inquiry-data/dynamic-filters-card"
                                );
                                import(
                                  "@/components/inquiry-data/query-management"
                                );
                              }}
                              onClick={() =>
                                trackMenuUsage({
                                  menu: m.label,
                                  submenu: c.label,
                                  path: "/inquiry-data/belanja",
                                })
                              }
                            >
                              {subIconFor(m.label, c.label)}
                              <span>{c.label}</span>
                            </Link>
                          </DropdownMenuItem>
                        ) : c.label === "Tematik" &&
                          m.label === "Inquiry Data" ? (
                          <DropdownMenuItem key={c.label} asChild>
                            <Link
                              href="/inquiry-data/tematik"
                              className="flex items-center w-full"
                              onMouseEnter={() => {
                                import(
                                  "@/components/inquiry-data/category-mandatory-filters"
                                );
                              }}
                              onClick={() =>
                                trackMenuUsage({
                                  menu: m.label,
                                  submenu: c.label,
                                  path: "/inquiry-data/tematik",
                                })
                              }
                            >
                              {subIconFor(m.label, c.label)}
                              <span>{c.label}</span>
                            </Link>
                          </DropdownMenuItem>
                        ) : c.label === "RKAKL Detail" &&
                          m.label === "Inquiry Data" ? (
                          <DropdownMenuItem key={c.label} asChild>
                            <Link
                              href="/inquiry-data/rkakl-detail"
                              className="flex items-center w-full"
                              onMouseEnter={() => {
                                import(
                                  "@/components/inquiry-data/dynamic-filters-card"
                                );
                              }}
                              onClick={() =>
                                trackMenuUsage({
                                  menu: m.label,
                                  submenu: c.label,
                                  path: "/inquiry-data/rkakl-detail",
                                })
                              }
                            >
                              {subIconFor(m.label, c.label)}
                              <span>{c.label}</span>
                            </Link>
                          </DropdownMenuItem>
                        ) : c.label === "Dashboard Supplier" &&
                          m.label === "Data Supplier" ? (
                          <DropdownMenuItem key={c.label} asChild>
                            <Link
                              href="/data-supplier/dashboard"
                              className="flex items-center w-full"
                              onMouseEnter={() => {
                                import(
                                  "@/components/data-supplier/DashboardSupplierClient"
                                );
                              }}
                              onClick={() =>
                                trackMenuUsage({
                                  menu: m.label,
                                  submenu: c.label,
                                  path: "/data-supplier/dashboard",
                                })
                              }
                            >
                              {subIconFor(m.label, c.label)}
                              <span>{c.label}</span>
                            </Link>
                          </DropdownMenuItem>
                        ) : c.label === "Profil Supplier" &&
                          m.label === "Data Supplier" ? (
                          <DropdownMenuItem key={c.label} asChild>
                            <Link
                              href="/data-supplier/profil"
                              className="flex items-center w-full"
                              onMouseEnter={() => {
                                import(
                                  "@/components/data-supplier/DashboardSupplierClient"
                                );
                              }}
                              onClick={() =>
                                trackMenuUsage({
                                  menu: m.label,
                                  submenu: c.label,
                                  path: "/data-supplier/profil",
                                })
                              }
                            >
                              {subIconFor(m.label, c.label)}
                              <span>{c.label}</span>
                            </Link>
                          </DropdownMenuItem>
                        ) : c.label === "Konsentrasi Supplier" &&
                          m.label === "Data Supplier" ? (
                          <DropdownMenuItem key={c.label} asChild>
                            <Link
                              href="/data-supplier/konsentrasi"
                              className="flex items-center w-full"
                              onMouseEnter={() => {
                                import(
                                  "@/components/data-supplier/DashboardSupplierClient"
                                );
                              }}
                              onClick={() =>
                                trackMenuUsage({
                                  menu: m.label,
                                  submenu: c.label,
                                  path: "/data-supplier/konsentrasi",
                                })
                              }
                            >
                              {subIconFor(m.label, c.label)}
                              <span>{c.label}</span>
                            </Link>
                          </DropdownMenuItem>
                        ) : c.label === "Deteksi Anomali Supplier" &&
                          m.label === "Data Supplier" ? (
                          <DropdownMenuItem key={c.label} asChild>
                            <Link
                              href="/data-supplier/anomali"
                              className="flex items-center w-full"
                              onMouseEnter={() => {
                                import(
                                  "@/components/data-supplier/DashboardSupplierClient"
                                );
                              }}
                              onClick={() =>
                                trackMenuUsage({
                                  menu: m.label,
                                  submenu: c.label,
                                  path: "/data-supplier/anomali",
                                })
                              }
                            >
                              {subIconFor(m.label, c.label)}
                              <span>{c.label}</span>
                            </Link>
                          </DropdownMenuItem>
                        ) : c.label === "Klaster Supplier" &&
                          m.label === "Data Supplier" ? (
                          <DropdownMenuItem key={c.label} asChild>
                            <Link
                              href="/data-supplier/klaster"
                              className="flex items-center w-full"
                              onMouseEnter={() => {
                                import(
                                  "@/components/data-supplier/DashboardSupplierClient"
                                );
                              }}
                              onClick={() =>
                                trackMenuUsage({
                                  menu: m.label,
                                  submenu: c.label,
                                  path: "/data-supplier/klaster",
                                })
                              }
                            >
                              {subIconFor(m.label, c.label)}
                              <span>{c.label}</span>
                            </Link>
                          </DropdownMenuItem>
                        ) : c.label === "Jaringan Supplier" &&
                          m.label === "Data Supplier" ? (
                          <DropdownMenuItem key={c.label} asChild>
                            <Link
                              href="/data-supplier/jaringan"
                              className="flex items-center w-full"
                              onMouseEnter={() => {
                                import(
                                  "@/components/data-supplier/DashboardSupplierClient"
                                );
                              }}
                              onClick={() =>
                                trackMenuUsage({
                                  menu: m.label,
                                  submenu: c.label,
                                  path: "/data-supplier/jaringan",
                                })
                              }
                            >
                              {subIconFor(m.label, c.label)}
                              <span>{c.label}</span>
                            </Link>
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            key={c.label}
                            className="flex items-center"
                          >
                            {subIconFor(m.label, c.label)}
                            <span>{c.label}</span>
                          </DropdownMenuItem>
                        ),
                      )}
                    </DropdownMenuContent>
                  ) : null}
                </DropdownMenu>
              ))}
            </div>
          </div>

          {/* Right pagination button */}
          {canGoRight && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Halaman selanjutnya"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-transparent hover:bg-accent"
              onClick={() => goToPage("next")}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          )}
        </div>
      </nav>

      {/* Normal sidebar below lg */}
      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <div className="border-b bg-white dark:bg-card">
            <div className="container mx-auto h-12 flex items-center px-2">
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <span className="ml-2 text-sm text-muted-foreground">Menu</span>
            </div>
          </div>
          <SheetContent side="left" className="p-0">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <div className="p-2 overflow-y-auto max-h-screen">
              {filteredMenu.map((m) => (
                <div key={m.label} className="border-b">
                  <div className="px-3 py-2 font-medium inline-flex items-center">
                    {iconFor(m.label)}
                    <span>{m.label}</span>
                  </div>
                  {m.children?.map((c) =>
                    c.label === "Dashboard Utama" && m.label === "Dashboard" ? (
                      <Link
                        key={c.label}
                        href="/dashboard/utama"
                        className="block w-full text-left px-6 py-2 text-sm hover:bg-muted"
                        onMouseEnter={() => {
                          import(
                            "@/components/dashboard/PerformanceMonitoringDashboard"
                          );
                        }}
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/dashboard/utama",
                          });
                          setOpen(false);
                        }}
                      >
                        <span className="inline-flex items-center">
                          {subIconFor(m.label, c.label)}
                          <span>{c.label}</span>
                        </span>
                      </Link>
                    ) : c.label === "Dashboard Program" &&
                      m.label === "Dashboard" ? (
                      <Link
                        key={c.label}
                        href="/dashboard/program"
                        className="block w-full text-left px-6 py-2 text-sm hover:bg-muted"
                        onMouseEnter={() => {
                          import("@/components/dashboard/ProgramCard");
                        }}
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/dashboard/program",
                          });
                          setOpen(false);
                        }}
                      >
                        <span className="inline-flex items-center">
                          {subIconFor(m.label, c.label)}
                          <span>{c.label}</span>
                        </span>
                      </Link>
                    ) : c.label === "Dashboard MBG" &&
                      m.label === "Makan Bergizi" ? (
                      <Link
                        key={c.label}
                        href="/makan-bergizi/dashboard"
                        className="block w-full text-left px-6 py-2 text-sm hover:bg-muted"
                        onMouseEnter={() => {
                          import("@/features/mbg/components/MapView");
                        }}
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/makan-bergizi/dashboard",
                          });
                          setOpen(false);
                        }}
                      >
                        <span className="inline-flex items-center">
                          {subIconFor(m.label, c.label)}
                          <span>{c.label}</span>
                        </span>
                      </Link>
                    ) : c.label === "Kertas Kerja" &&
                      m.label === "Makan Bergizi" ? (
                      <Link
                        key={c.label}
                        href="/makan-bergizi/kertas-kerja"
                        className="block w-full text-left px-6 py-2 text-sm hover:bg-muted"
                        onMouseEnter={() => {
                          import("@/features/mbg/components/MapView");
                        }}
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/makan-bergizi/kertas-kerja",
                          });
                          setOpen(false);
                        }}
                      >
                        <span className="inline-flex items-center">
                          {subIconFor(m.label, c.label)}
                          <span>{c.label}</span>
                        </span>
                      </Link>
                    ) : c.label === "Profil" && m.label === "Tentang Kita" ? (
                      <Link
                        key={c.label}
                        href="/tentang-kita/profil"
                        className="block w-full text-left px-6 py-2 text-sm hover:bg-muted"
                        onMouseEnter={() => {}}
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/tentang-kita/profil",
                          });
                          setOpen(false);
                        }}
                      >
                        <span className="inline-flex items-center">
                          {subIconFor(m.label, c.label)}
                          <span>{c.label}</span>
                        </span>
                      </Link>
                    ) : c.label === "Summary" && m.label === "EPA" ? (
                      <Link
                        key={c.label}
                        href="/epa/summary"
                        className="block w-full text-left px-6 py-2 text-sm hover:bg-muted"
                        onMouseEnter={() => {
                          import("@/components/epa/filter-card");
                        }}
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/epa/summary",
                          });
                          setOpen(false);
                        }}
                      >
                        <span className="inline-flex items-center">
                          {subIconFor(m.label, c.label)}
                          <span>{c.label}</span>
                        </span>
                      </Link>
                    ) : c.label === "Proyeksi TKD" &&
                      m.label === "Transfer Daerah" ? (
                      <Link
                        key={c.label}
                        href="/transfer-daerah/proyeksi-tkd"
                        className="block w-full text-left px-6 py-2 text-sm hover:bg-muted"
                        onMouseEnter={() => {
                          import("@/components/transfer-daerah/data-kmk-tab");
                        }}
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/transfer-daerah/proyeksi-tkd",
                          });
                          setOpen(false);
                        }}
                      >
                        <span className="inline-flex items-center">
                          {subIconFor(m.label, c.label)}
                          <span>{c.label}</span>
                        </span>
                      </Link>
                    ) : c.label === "Upload Laporan" &&
                      m.label === "Transfer Daerah" ? (
                      <Link
                        key={c.label}
                        href="/transfer-daerah/upload-laporan"
                        className="block w-full text-left px-6 py-2 text-sm hover:bg-muted"
                        onMouseEnter={() => {
                          import("@/components/transfer-daerah/data-kmk-tab");
                        }}
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/transfer-daerah/upload-laporan",
                          });
                          setOpen(false);
                        }}
                      >
                        <span className="inline-flex items-center">
                          {subIconFor(m.label, c.label)}
                          <span>{c.label}</span>
                        </span>
                      </Link>
                    ) : c.label === "DAU" && m.label === "Transfer Daerah" ? (
                      <Link
                        key={c.label}
                        href="/transfer-daerah/dau"
                        className="block w-full text-left px-6 py-2 text-sm hover:bg-muted"
                        onMouseEnter={() => {
                          import(
                            "@/components/transfer-daerah/data-transaksi-tab"
                          );
                        }}
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/transfer-daerah/dau",
                          });
                          setOpen(false);
                        }}
                      >
                        <span className="inline-flex items-center">
                          {subIconFor(m.label, c.label)}
                          <span>{c.label}</span>
                        </span>
                      </Link>
                    ) : c.label === "Belanja" && m.label === "Inquiry Data" ? (
                      <Link
                        key={c.label}
                        href="/inquiry-data/belanja"
                        className="block w-full text-left px-6 py-2 text-sm hover:bg-muted"
                        onMouseEnter={() => {
                          import(
                            "@/components/inquiry-data/dynamic-filters-card"
                          );
                          import("@/components/inquiry-data/query-management");
                        }}
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/inquiry-data/belanja",
                          });
                          setOpen(false);
                        }}
                      >
                        <span className="inline-flex items-center">
                          {subIconFor(m.label, c.label)}
                          <span>{c.label}</span>
                        </span>
                      </Link>
                    ) : c.label === "Tematik" && m.label === "Inquiry Data" ? (
                      <Link
                        key={c.label}
                        href="/inquiry-data/tematik"
                        className="block w-full text-left px-6 py-2 text-sm hover:bg-muted"
                        onMouseEnter={() => {
                          import(
                            "@/components/inquiry-data/category-mandatory-filters"
                          );
                        }}
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/inquiry-data/tematik",
                          });
                          setOpen(false);
                        }}
                      >
                        <span className="inline-flex items-center">
                          {subIconFor(m.label, c.label)}
                          <span>{c.label}</span>
                        </span>
                      </Link>
                    ) : c.label === "RKAKL Detail" &&
                      m.label === "Inquiry Data" ? (
                      <Link
                        key={c.label}
                        href="/inquiry-data/rkakl-detail"
                        className="block w-full text-left px-6 py-2 text-sm hover:bg-muted"
                        onMouseEnter={() => {
                          import(
                            "@/components/inquiry-data/dynamic-filters-card"
                          );
                        }}
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/inquiry-data/rkakl-detail",
                          });
                          setOpen(false);
                        }}
                      >
                        <span className="inline-flex items-center">
                          {subIconFor(m.label, c.label)}
                          <span>{c.label}</span>
                        </span>
                      </Link>
                    ) : c.label === "Dashboard Supplier" &&
                      m.label === "Data Supplier" ? (
                      <Link
                        key={c.label}
                        href="/data-supplier/dashboard"
                        className="block w-full text-left px-6 py-2 text-sm hover:bg-muted"
                        onMouseEnter={() => {
                          import(
                            "@/components/data-supplier/DashboardSupplierClient"
                          );
                        }}
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/data-supplier/dashboard",
                          });
                          setOpen(false);
                        }}
                      >
                        <span className="inline-flex items-center">
                          {subIconFor(m.label, c.label)}
                          <span>{c.label}</span>
                        </span>
                      </Link>
                    ) : c.label === "Profil Supplier" &&
                      m.label === "Data Supplier" ? (
                      <Link
                        key={c.label}
                        href="/data-supplier/profil"
                        className="block w-full text-left px-6 py-2 text-sm hover:bg-muted"
                        onMouseEnter={() => {
                          import(
                            "@/components/data-supplier/DashboardSupplierClient"
                          );
                        }}
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/data-supplier/profil",
                          });
                          setOpen(false);
                        }}
                      >
                        <span className="inline-flex items-center">
                          {subIconFor(m.label, c.label)}
                          <span>{c.label}</span>
                        </span>
                      </Link>
                    ) : c.label === "Konsentrasi Supplier" &&
                      m.label === "Data Supplier" ? (
                      <Link
                        key={c.label}
                        href="/data-supplier/konsentrasi"
                        className="block w-full text-left px-6 py-2 text-sm hover:bg-muted"
                        onMouseEnter={() => {
                          import(
                            "@/components/data-supplier/DashboardSupplierClient"
                          );
                        }}
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/data-supplier/konsentrasi",
                          });
                          setOpen(false);
                        }}
                      >
                        <span className="inline-flex items-center">
                          {subIconFor(m.label, c.label)}
                          <span>{c.label}</span>
                        </span>
                      </Link>
                    ) : c.label === "Deteksi Anomali Supplier" &&
                      m.label === "Data Supplier" ? (
                      <Link
                        key={c.label}
                        href="/data-supplier/anomali"
                        className="block w/full text-left px-6 py-2 text-sm hover:bg-muted"
                        onMouseEnter={() => {
                          import(
                            "@/components/data-supplier/DashboardSupplierClient"
                          );
                        }}
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/data-supplier/anomali",
                          });
                          setOpen(false);
                        }}
                      >
                        <span className="inline-flex items-center">
                          {subIconFor(m.label, c.label)}
                          <span>{c.label}</span>
                        </span>
                      </Link>
                    ) : c.label === "Klaster Supplier" &&
                      m.label === "Data Supplier" ? (
                      <Link
                        key={c.label}
                        href="/data-supplier/klaster"
                        className="block w-full text-left px-6 py-2 text-sm hover:bg-muted"
                        onMouseEnter={() => {
                          import(
                            "@/components/data-supplier/DashboardSupplierClient"
                          );
                        }}
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/data-supplier/klaster",
                          });
                          setOpen(false);
                        }}
                      >
                        <span className="inline-flex items-center">
                          {subIconFor(m.label, c.label)}
                          <span>{c.label}</span>
                        </span>
                      </Link>
                    ) : c.label === "Jaringan Supplier" &&
                      m.label === "Data Supplier" ? (
                      <Link
                        key={c.label}
                        href="/data-supplier/jaringan"
                        className="block w-full text-left px-6 py-2 text-sm hover:bg-muted"
                        onMouseEnter={() => {
                          import(
                            "@/components/data-supplier/DashboardSupplierClient"
                          );
                        }}
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/data-supplier/jaringan",
                          });
                          setOpen(false);
                        }}
                      >
                        <span className="inline-flex items-center">
                          {subIconFor(m.label, c.label)}
                          <span>{c.label}</span>
                        </span>
                      </Link>
                    ) : (
                      <button
                        key={c.label}
                        className="w-full text-left px-6 py-2 text-sm hover:bg-muted"
                        onClick={() => setOpen(false)}
                      >
                        <span className="inline-flex items-center">
                          {subIconFor(m.label, c.label)}
                          <span>{c.label}</span>
                        </span>
                      </button>
                    ),
                  )}
                </div>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
