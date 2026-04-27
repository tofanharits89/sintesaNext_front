"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  CalendarDays,
  User,
  Phone,
  Upload,
  Search,
  Database,
  PieChart,
  TriangleAlert,
  Share2,
  Gauge,
  BookOpen,
  MapPin,
  Archive,
  Gavel,
  CreditCard,
  BarChart2,
} from "lucide-react";
import { useEffect, useRef, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { trackMenuUsage } from "@/hooks/use-menu-usage";
import { useAuth } from "@/hooks/useAuth";

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
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

export type MenuItem = {
  label: string;
  children?: { label: string }[];
};

const defaultMenu: MenuItem[] = [
  {
    label: "Dashboard",
    children: [
      { label: "Dashboard Utama" },
      { label: "Dashboard Program" },
      { label: "Dashboard Efisiensi" },
      { label: "Dashboard Pengendalian Belanja" },
    ],
  },
  {
    label: "Makan Bergizi",
    children: [
      { label: "Dashboard MBG" },
      { label: "Kertas Kerja" },
      { label: "Data MBG" },
      { label: "Trend MBG" },
      { label: "Proyeksi Power Bi" },
    ],
  },
  {
    label: "Monev KKP",
    children: [
      { label: "KPPN" },
      { label: "Kanwil" },
      { label: "Direktorat PA" },
    ],
  },
  {
    label: "Kewilayahan",
    children: [
      { label: "Belanja" },
      { label: "Tematik" },
      { label: "Subsidi" },
    ],
  },
  {
    label: "Transfer Daerah",
    children: [
      { label: "DAU" },
      { label: "Upload Laporan" },
      { label: "Proyeksi TKD" },
      { label: "Penilaian IKU" },
      { label: "Dataset TKD" },
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
      { label: "Revisi DIPA" },
      { label: "Prognosis" },
    ],
  },
  {
    label: "Laporan",
    children: [
      { label: "Harmonisasi" },
      { label: "Tantangan TPID" },
      { label: "Monitoring Blokir Perjadin" },
      { label: "Monev PNBP" },
      { label: "Weekly Report" },
      { label: "Monthly Report" },
    ],
  },
  {
    label: "Data Makrokesra",
    children: [{ label: "Data BPS" }],
  },
  {
    label: "Rowset Data",
    children: [{ label: "Generate Dataset" }, { label: "SP2D" }],
  },
  {
    label: "Dispensasi",
    children: [{ label: "LLAT" }, { label: "Kontrak KPPN" }],
  },
  {
    label: "Monev IKPA",
    children: [{ label: "Monev Dispensasi IKPA" }],
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
    children: [
      { label: "Summary" },
      { label: "Analisa EPA" },
      { label: "Rekap EPA" },
    ],
  },
  {
    label: "Spending Review",
    children: [{ label: "Sektor" }, { label: "Rekomendasi" }],
  },
  {
    label: "IKI PA",
    children: [{ label: "IKI Kontraktual" }, { label: "IKI APBD" }],
  },

  {
    label: "Profil K/L",
    children: [{ label: "Kementerian" }, { label: "Lembaga" }],
  },
  {
    label: "Tentang Kita",
    children: [{ label: "Profil" }, { label: "Kontak" }],
  },
];

const MENU_ROUTE_PREFIXES: Array<{ prefix: string; parent: string }> = [
  { prefix: "/dashboard", parent: "Dashboard" },
  { prefix: "/makan-bergizi", parent: "Makan Bergizi" },
  { prefix: "/monev-kkp", parent: "Monev KKP" },
  { prefix: "/belwil", parent: "Kewilayahan" },
  { prefix: "/transfer-daerah", parent: "Transfer Daerah" },
  { prefix: "/inquiry-data", parent: "Inquiry Data" },
  { prefix: "/laporan", parent: "Laporan" },
  { prefix: "/data-makrokesra", parent: "Data Makrokesra" },
  { prefix: "/menu-rowset", parent: "Rowset Data" },
  { prefix: "/dispensasi", parent: "Dispensasi" },
  { prefix: "/ikpa", parent: "Monev IKPA" },
  { prefix: "/data-supplier", parent: "Data Supplier" },
  { prefix: "/epa", parent: "EPA" },
  { prefix: "/spending-review", parent: "Spending Review" },
  { prefix: "/iku-pa", parent: "IKI PA" },
  { prefix: "/profil-kl", parent: "Profil K/L" },
  { prefix: "/tentang-kita", parent: "Tentang Kita" },
];

function resolveActiveMenuLabel(pathname: string | null): string | null {
  if (!pathname) return null;

  const match = MENU_ROUTE_PREFIXES.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  return match?.parent ?? null;
}

function isPathActive(pathname: string | null, href: string): boolean {
  if (!pathname || href === "#") return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ResponsiveSidebar({
  menu = defaultMenu,
}: {
  menu?: MenuItem[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  // Filter menu based on user role
  const filteredMenu = useMemo(() => {
    if (!user) return menu;

    const isAdmin = user.role === "super_admin" || user.role === "co_admin";

    return menu
      .filter((item) => {
        // Only admins can see Data Supplier
        if (item.label === "Data Supplier" && !isAdmin) return false;
        return true;
      })
      .map((item) => {
        // Filter Monev KKP children based on role
        if (item.label === "Monev KKP") {
          if (isAdmin) return item; // Admins see all submenus

          const allowedChildren = (item.children || []).filter((child) => {
            if (child.label === "KPPN" && user.role === "kppn") return true;
            if (child.label === "Kanwil" && user.role === "kanwil_djpb")
              return true;
            if (child.label === "Direktorat PA" && user.role === "ditpa")
              return true;
            return false;
          });

          if (allowedChildren.length === 0) return null; // Hide menu entirely
          return { ...item, children: allowedChildren };
        }

        // Filter Dashboard children: hide Pengendalian Belanja for non-ditpa, non-admin
        if (item.label === "Dashboard") {
          if (isAdmin || user.role === "ditpa") return item;
          return {
            ...item,
            children: (item.children || []).filter(
              (child) => child.label !== "Dashboard Pengendalian Belanja",
            ),
          };
        }

        // Filter IKI PA children:
        if (item.label === "IKI PA") {
          const isKontraktualAllowed = isAdmin || user.role === "ditpa";
          const isApbdAllowed = isAdmin || user.role === "kanwil_djpb";

          const allowedChildren = (item.children || []).filter((child) => {
            if (child.label === "IKI Kontraktual" && !isKontraktualAllowed)
              return false;
            if (child.label === "IKI APBD" && !isApbdAllowed) return false;
            return true;
          });

          if (allowedChildren.length === 0) return null; // Hide menu entirely
          return { ...item, children: allowedChildren };
        }

        return item;
      })
      .filter(Boolean) as MenuItem[];
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
      case "Data Makrokesra":
        return (
          <PieChart className={`${cls} text-violet-600 dark:text-violet-400`} />
        );
      case "Rowset Data":
        return (
          <Inbox className={`${cls} text-green-600 dark:text-green-400`} />
        );
      case "Kewilayahan":
        return <MapPin className={`${cls} text-teal-600 dark:text-teal-400`} />;
      case "Dispensasi":
        return <BookOpen className={`${cls} text-red-600 dark:text-red-400`} />;
      case "Monev IKPA":
        return <Gauge className={`${cls} text-red-600 dark:text-red-400`} />;
      case "Monev KKP":
        return (
          <CreditCard
            className={`${cls} text-orange-600 dark:text-orange-400`}
          />
        );
      case "IKI PA":
        return (
          <Gauge className={`${cls} text-orange-600 dark:text-orange-400`} />
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
      case "Dashboard__Dashboard Efisiensi":
        return <TrendingUp className={cls} />;
      case "Dashboard__Dashboard Pengendalian Belanja":
        return <BarChart2 className={cls} />;
      case "Makan Bergizi__Dashboard MBG":
        return <LineChart className={cls} />;
      case "Makan Bergizi__Kertas Kerja":
        return <ClipboardList className={cls} />;
      case "Makan Bergizi__Data MBG":
        return <BarChart2 className={cls} />;
      case "Makan Bergizi__Trend MBG":
        return <TrendingUp className={cls} />;
      case "Makan Bergizi__Proyeksi Power Bi":
        return <Search className={cls} />;
      case "Profil K/L__Kementerian":
        return <Users className={cls} />;
      case "Profil K/L__Lembaga":
        return <Building2 className={cls} />;
      case "EPA__Summary":
        return <LineChart className={cls} />;
      case "EPA__Analisa EPA":
        return <PieChart className={cls} />;
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
      case "Transfer Daerah__Penilaian IKU":
        return <Gauge className={cls} />;
      case "Transfer Daerah__Dataset TKD":
        return <Database className={cls} />;
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
      case "Inquiry Data__Revisi DIPA":
        return <Database className={cls} />;
      case "Inquiry Data__Prognosis":
        return <Database className={cls} />;
      case "Laporan__Monthly Report":
        return <CalendarDays className={cls} />;
      case "Laporan__Weekly Report":
        return <CalendarDays className={cls} />;
      case "Laporan__Harmonisasi":
        return <CalendarDays className={cls} />;
      case "Laporan__Tantangan TPID":
        return <CalendarDays className={cls} />;
      case "Laporan__Monitoring Blokir Perjadin":
        return <CalendarDays className={cls} />;
      case "Laporan__Monev PNBP":
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
      case "Data Makrokesra__Data BPS":
        return <Database className={cls} />;
      case "Rowset Data__Generate Dataset":
        return <CheckCircle className={cls} />;
      case "Rowset Data__SP2D":
        return <Banknote className={cls} />;
      case "Kewilayahan__Belanja":
        return <Database className={cls} />;
      case "Kewilayahan__Tematik":
        return <Database className={cls} />;
      case "Kewilayahan__Subsidi":
        return <Database className={cls} />;
      case "Dispensasi__LLAT":
        return <CheckCircle className={cls} />;
      case "Dispensasi__Kontrak KPPN":
        return <Banknote className={cls} />;
      case "Monev IKPA__Monev Dispensasi IKPA":
        return <Gavel className={cls} />;
      case "Monev KKP__KPPN":
        return <Building2 className={cls} />;
      case "Monev KKP__Kanwil":
        return <Building2 className={cls} />;
      case "Monev KKP__Direktorat PA":
        return <Building2 className={cls} />;
      case "IKI PA__IKI Kontraktual":
        return <Building2 className={cls} />;
      case "IKI PA__IKI APBD":
        return <BookOpen className={cls} />;
      default:
        return null;
    }
  };

  // Page-based pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5); // Default items per page
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeMenuLabel = useMemo(
    () => resolveActiveMenuLabel(pathname),
    [pathname],
  );

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

  useEffect(() => {
    if (!activeMenuLabel || itemsPerPage <= 0) return;

    const activeMenuIndex = filteredMenu.findIndex(
      (menuItem) => menuItem.label === activeMenuLabel,
    );
    if (activeMenuIndex < 0) return;

    const activePage = Math.floor(activeMenuIndex / itemsPerPage);
    setCurrentPage((prevPage) =>
      prevPage === activePage ? prevPage : activePage,
    );
  }, [activeMenuLabel, filteredMenu, itemsPerPage]);

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
        className="hidden lg:block sticky top-22 z-30 mx-4 sm:mx-6 lg:mx-8 border bg-white dark:bg-card shadow-sm rounded-xl"
      >
        <div ref={containerRef} className="relative">
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
            <NavigationMenu className="h-12" viewport={false}>
              <NavigationMenuList className="gap-1">
                {currentPageItems.map((m) => (
                  <NavigationMenuItem key={m.label}>
                    <NavigationMenuTrigger
                      className={cn(
                        "h-9 w-48 gap-1 bg-white dark:bg-card hover:bg-accent dark:hover:bg-accent",
                        activeMenuLabel === m.label &&
                          "bg-accent text-accent-foreground",
                      )}
                    >
                      <span className="inline-flex items-center">
                        {iconFor(m.label)}
                        <span>{m.label}</span>
                      </span>
                    </NavigationMenuTrigger>
                    {m.children?.length ? (
                      <NavigationMenuContent className="left-0 p-1.5">
                        <ul className="grid w-72 gap-1">
                          {m.children.map((c) => {
                            const menuKey = `${m.label}__${c.label}`;
                            let href = "#";
                            let onMouseEnterFn = () => {};

                            // Route mapping
                            if (
                              c.label === "Dashboard Utama" &&
                              m.label === "Dashboard"
                            ) {
                              href = "/dashboard/utama";
                              onMouseEnterFn = () =>
                                import("@/components/dashboard/PerformanceMonitoringDashboard");
                            } else if (
                              c.label === "Dashboard Program" &&
                              m.label === "Dashboard"
                            ) {
                              href = "/dashboard/program";
                              onMouseEnterFn = () =>
                                import("@/components/dashboard/ProgramCard");
                            } else if (
                              c.label === "Dashboard Efisiensi" &&
                              m.label === "Dashboard"
                            ) {
                              href = "/dashboard/efisiensi";
                            } else if (
                              c.label === "Dashboard Pengendalian Belanja" &&
                              m.label === "Dashboard"
                            ) {
                              href = "/dashboard/pengendalian-belanja";
                            } else if (
                              c.label === "Kontrak" &&
                              m.label === "Inquiry Data"
                            ) {
                              href = "/inquiry-data/kontrak";
                              onMouseEnterFn = () =>
                                import("@/components/inquiry-data/enhanced-filter-card");
                            } else if (
                              c.label === "UP/TUP" &&
                              m.label === "Inquiry Data"
                            ) {
                              href = "/inquiry-data/up-tup";
                              onMouseEnterFn = () =>
                                import("@/components/inquiry-data/enhanced-filter-card");
                            } else if (
                              c.label === "Penerimaan PNBP" &&
                              m.label === "Inquiry Data"
                            ) {
                              href = "/inquiry-data/penerimaan-pnbp";
                              onMouseEnterFn = () =>
                                import("@/components/inquiry-data/enhanced-filter-card");
                            } else if (
                              c.label === "Revisi DIPA" &&
                              m.label === "Inquiry Data"
                            ) {
                              href = "/inquiry-data/revisi-dipa";
                              onMouseEnterFn = () =>
                                import("@/components/inquiry-data/enhanced-filter-card");
                            } else if (
                              c.label === "Prognosis" &&
                              m.label === "Inquiry Data"
                            ) {
                              href = "/inquiry-data/prognosis";
                              onMouseEnterFn = () =>
                                import("@/components/inquiry-data/enhanced-filter-card");
                            } else if (
                              c.label === "Dashboard MBG" &&
                              m.label === "Makan Bergizi"
                            ) {
                              href = "/makan-bergizi/dashboard";
                              onMouseEnterFn = () =>
                                import("@/features/mbg/components/MapView");
                            } else if (
                              c.label === "Kertas Kerja" &&
                              m.label === "Makan Bergizi"
                            ) {
                              href = "/makan-bergizi/kertas-kerja";
                              onMouseEnterFn = () =>
                                import("@/features/mbg/components/MapView");
                            } else if (
                              c.label === "Data MBG" &&
                              m.label === "Makan Bergizi"
                            ) {
                              href = "/makan-bergizi/data-mbg";
                              onMouseEnterFn = () =>
                                import("@/components/mbg/data-mbg/data-sp2d-mbg");
                            } else if (
                              c.label === "Trend MBG" &&
                              m.label === "Makan Bergizi"
                            ) {
                              href = "/makan-bergizi/trend-mbg";
                              onMouseEnterFn = () =>
                                import("@/components/mbg/trend-mbg/landing");
                            } else if (
                              c.label === "Proyeksi Power Bi" &&
                              m.label === "Makan Bergizi"
                            ) {
                              href = "/makan-bergizi/proyeksi-bi";
                              onMouseEnterFn = () =>
                                import("@/components/mbg/proyeksi-bi/landing");
                            } else if (
                              c.label === "Profil" &&
                              m.label === "Tentang Kita"
                            ) {
                              href = "/tentang-kita/profil";
                            } else if (
                              c.label === "Summary" &&
                              m.label === "EPA"
                            ) {
                              href = "/epa/summary";
                              onMouseEnterFn = () =>
                                import("@/components/epa/filter-card");
                            } else if (
                              c.label === "Analisa EPA" &&
                              m.label === "EPA"
                            ) {
                              href = "/epa/analisa";
                              onMouseEnterFn = () =>
                                import("@/components/epa/filter-card");
                            } else if (
                              c.label === "Rekap EPA" &&
                              m.label === "EPA"
                            ) {
                              href = "/epa/rekap";
                              onMouseEnterFn = () => {
                                import("@/components/epa/rekap-filter-card");
                                import("@/components/epa/rekap-data-table");
                              };
                            } else if (
                              c.label === "Proyeksi TKD" &&
                              m.label === "Transfer Daerah"
                            ) {
                              href = "/transfer-daerah/proyeksi-tkd";
                              onMouseEnterFn = () =>
                                import("@/components/transfer-daerah/data-kmk-tab");
                            } else if (
                              c.label === "Upload Laporan" &&
                              m.label === "Transfer Daerah"
                            ) {
                              href = "/transfer-daerah/upload-laporan";
                              onMouseEnterFn = () =>
                                import("@/components/transfer-daerah/data-kmk-tab");
                            } else if (
                              c.label === "DAU" &&
                              m.label === "Transfer Daerah"
                            ) {
                              href = "/transfer-daerah/dau";
                              onMouseEnterFn = () =>
                                import("@/components/transfer-daerah/data-transaksi-tab");
                            } else if (
                              c.label === "Penilaian IKU" &&
                              m.label === "Transfer Daerah"
                            ) {
                              href = "/transfer-daerah/penilaian-iku";
                              onMouseEnterFn = () =>
                                import("@/components/transfer-daerah/penilaian-iku/landing");
                            } else if (
                              c.label === "Dataset TKD" &&
                              m.label === "Transfer Daerah"
                            ) {
                              href = "/transfer-daerah/dataset-tkd";
                              onMouseEnterFn = () =>
                                import("@/components/transfer-daerah/download-dataset/landing");
                            } else if (
                              c.label === "Belanja" &&
                              m.label === "Inquiry Data"
                            ) {
                              href = "/inquiry-data/belanja";
                              onMouseEnterFn = () => {
                                import("@/components/inquiry-data/dynamic-filters-card");
                                import("@/components/inquiry-data/query-management");
                              };
                            } else if (
                              c.label === "Tematik" &&
                              m.label === "Inquiry Data"
                            ) {
                              href = "/inquiry-data/tematik";
                              onMouseEnterFn = () =>
                                import("@/components/inquiry-data/category-mandatory-filters");
                            } else if (
                              c.label === "RKAKL Detail" &&
                              m.label === "Inquiry Data"
                            ) {
                              href = "/inquiry-data/rkakl-detail";
                              onMouseEnterFn = () =>
                                import("@/components/inquiry-data/dynamic-filters-card");
                            } else if (
                              c.label === "Dashboard Supplier" &&
                              m.label === "Data Supplier"
                            ) {
                              href = "/data-supplier/dashboard";
                              onMouseEnterFn = () =>
                                import("@/components/data-supplier/DashboardSupplierClient");
                            } else if (
                              c.label === "Profil Supplier" &&
                              m.label === "Data Supplier"
                            ) {
                              href = "/data-supplier/profil";
                              onMouseEnterFn = () =>
                                import("@/components/data-supplier/DashboardSupplierClient");
                            } else if (
                              c.label === "Konsentrasi Supplier" &&
                              m.label === "Data Supplier"
                            ) {
                              href = "/data-supplier/konsentrasi";
                              onMouseEnterFn = () =>
                                import("@/components/data-supplier/DashboardSupplierClient");
                            } else if (
                              c.label === "Deteksi Anomali Supplier" &&
                              m.label === "Data Supplier"
                            ) {
                              href = "/data-supplier/anomali";
                              onMouseEnterFn = () =>
                                import("@/components/data-supplier/DashboardSupplierClient");
                            } else if (
                              c.label === "Klaster Supplier" &&
                              m.label === "Data Supplier"
                            ) {
                              href = "/data-supplier/klaster";
                              onMouseEnterFn = () =>
                                import("@/components/data-supplier/DashboardSupplierClient");
                            } else if (
                              c.label === "Jaringan Supplier" &&
                              m.label === "Data Supplier"
                            ) {
                              href = "/data-supplier/jaringan";
                              onMouseEnterFn = () =>
                                import("@/components/data-supplier/DashboardSupplierClient");
                            } else if (
                              c.label === "Monthly Report" &&
                              m.label === "Laporan"
                            ) {
                              href = "/laporan/monthly-report";
                            } else if (
                              c.label === "Weekly Report" &&
                              m.label === "Laporan"
                            ) {
                              href = "/laporan/weekly-report";
                            } else if (
                              c.label === "Harmonisasi" &&
                              m.label === "Laporan"
                            ) {
                              href = "/laporan/harmonisasi";
                            } else if (
                              c.label === "Tantangan TPID" &&
                              m.label === "Laporan"
                            ) {
                              href = "/laporan/tpid";
                            } else if (
                              c.label === "Monitoring Blokir Perjadin" &&
                              m.label === "Laporan"
                            ) {
                              href = "/laporan/blokir-perjadin";
                            } else if (
                              c.label === "Monev PNBP" &&
                              m.label === "Laporan"
                            ) {
                              href = "/laporan/monev-pnbp";
                            } else if (
                              c.label === "Data BPS" &&
                              m.label === "Data Makrokesra"
                            ) {
                              href = "/data-makrokesra/data-bps";
                            } else if (
                              c.label === "SP2D" &&
                              m.label === "Rowset Data"
                            ) {
                              href = "/menu-rowset/sp2d";
                            } else if (
                              c.label === "Generate Dataset" &&
                              m.label === "Rowset Data"
                            ) {
                              href = "/menu-rowset/dataset";
                            } else if (
                              c.label === "Belanja" &&
                              m.label === "Kewilayahan"
                            ) {
                              href = "/belwil/belanja";
                            } else if (
                              c.label === "Tematik" &&
                              m.label === "Kewilayahan"
                            ) {
                              href = "/belwil/tematik";
                            } else if (
                              c.label === "Subsidi" &&
                              m.label === "Kewilayahan"
                            ) {
                              href = "/belwil/subsidi";
                            } else if (
                              c.label === "LLAT" &&
                              m.label === "Dispensasi"
                            ) {
                              href = "/dispensasi/llat";
                            } else if (
                              c.label === "Kontrak KPPN" &&
                              m.label === "Dispensasi"
                            ) {
                              href = "/dispensasi/kontrak-kppn";
                            } else if (
                              c.label === "Monev Dispensasi IKPA" &&
                              m.label === "Monev IKPA"
                            ) {
                              href = "/ikpa";
                            } else if (
                              c.label === "KPPN" &&
                              m.label === "Monev KKP"
                            ) {
                              href = "/monev-kkp/kppn";
                              onMouseEnterFn = () =>
                                import("@/components/monev-kkp/kppn-content");
                            } else if (
                              c.label === "Kanwil" &&
                              m.label === "Monev KKP"
                            ) {
                              href = "/monev-kkp/kanwil";
                              onMouseEnterFn = () =>
                                import("@/components/monev-kkp/kanwil-content");
                            } else if (
                              c.label === "Direktorat PA" &&
                              m.label === "Monev KKP"
                            ) {
                              href = "/monev-kkp/direktorat-pa";
                              onMouseEnterFn = () =>
                                import("@/components/monev-kkp/direktorat-pa-content");
                            } else if (
                              c.label === "IKI Kontraktual" &&
                              m.label === "IKI PA"
                            ) {
                              href = "/iku-pa/kontraktual";
                              onMouseEnterFn = () =>
                                import("@/components/iku-pa/kontraktual");
                            } else if (
                              c.label === "IKI APBD" &&
                              m.label === "IKI PA"
                            ) {
                              href = "/iku-pa/apbd";
                              onMouseEnterFn = () =>
                                import("@/components/iku-pa/apbd");
                            }

                            return (
                              <li key={c.label}>
                                <NavigationMenuLink asChild>
                                  <Link
                                    href={href}
                                    className={cn(
                                      "flex w-full flex-row items-center gap-2 rounded-md px-2 py-1",
                                      isPathActive(pathname, href)
                                        ? "bg-accent text-accent-foreground"
                                        : "hover:bg-accent/60",
                                    )}
                                    onMouseEnter={onMouseEnterFn}
                                    onClick={() =>
                                      trackMenuUsage({
                                        menu: m.label,
                                        submenu: c.label,
                                        path: href,
                                      })
                                    }
                                  >
                                    {subIconFor(m.label, c.label)}
                                    <span>{c.label}</span>
                                  </Link>
                                </NavigationMenuLink>
                              </li>
                            );
                          })}
                        </ul>
                      </NavigationMenuContent>
                    ) : null}
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
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
          <div className="border bg-white dark:bg-card shadow-sm mx-4 sm:mx-6 fixed top-22 left-0 right-0 sm:left-0 sm:right-0 z-30 rounded-xl">
            <div className="h-12 flex items-center px-4">
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <span className="ml-2 text-sm text-muted-foreground">Menu</span>
            </div>
          </div>
          <SheetContent
            side="left"
            className="p-0 border shadow-sm bg-zinc-100 dark:bg-black"
          >
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
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
                        onMouseEnter={() => {
                          import("@/components/dashboard/PerformanceMonitoringDashboard");
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
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
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
                    ) : c.label === "Dashboard Efisiensi" &&
                      m.label === "Dashboard" ? (
                      <Link
                        key={c.label}
                        href="/dashboard/efisiensi"
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/dashboard/efisiensi",
                          });
                          setOpen(false);
                        }}
                      >
                        <span className="inline-flex items-center">
                          {subIconFor(m.label, c.label)}
                          <span>{c.label}</span>
                        </span>
                      </Link>
                    ) : c.label === "Dashboard Pengendalian Belanja" &&
                      m.label === "Dashboard" ? (
                      <Link
                        key={c.label}
                        href="/dashboard/pengendalian-belanja"
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/dashboard/pengendalian-belanja",
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
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
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
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
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
                    ) : c.label === "Data MBG" &&
                      m.label === "Makan Bergizi" ? (
                      <Link
                        key={c.label}
                        href="/makan-bergizi/data-mbg"
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
                        onMouseEnter={() => {
                          import("@/components/mbg/data-mbg/data-sp2d-mbg");
                        }}
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/makan-bergizi/data-mbg",
                          });
                          setOpen(false);
                        }}
                      >
                        <span className="inline-flex items-center">
                          {subIconFor(m.label, c.label)}
                          <span>{c.label}</span>
                        </span>
                      </Link>
                    ) : c.label === "Trend MBG" &&
                      m.label === "Makan Bergizi" ? (
                      <Link
                        key={c.label}
                        href="/makan-bergizi/trend-mbg"
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
                        onMouseEnter={() => {
                          import("@/components/mbg/trend-mbg/landing");
                        }}
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/makan-bergizi/trend-mbg",
                          });
                          setOpen(false);
                        }}
                      >
                        <span className="inline-flex items-center">
                          {subIconFor(m.label, c.label)}
                          <span>{c.label}</span>
                        </span>
                      </Link>
                    ) : c.label === "Proyeksi BI" &&
                      m.label === "Makan Bergizi" ? (
                      <Link
                        key={c.label}
                        href="/makan-bergizi/proyeksi-bi"
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
                        onMouseEnter={() => {
                          import("@/components/mbg/proyeksi-bi/landing");
                        }}
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/makan-bergizi/proyeksi-bi",
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
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
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
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
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
                    ) : c.label === "Analisa EPA" && m.label === "EPA" ? (
                      <Link
                        key={c.label}
                        href="/epa/analisa"
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
                        onMouseEnter={() => {
                          import("@/components/epa/filter-card");
                        }}
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/epa/analisa",
                          });
                          setOpen(false);
                        }}
                      >
                        <span className="inline-flex items-center">
                          {subIconFor(m.label, c.label)}
                          <span>{c.label}</span>
                        </span>
                      </Link>
                    ) : c.label === "Rekap EPA" && m.label === "EPA" ? (
                      <Link
                        key={c.label}
                        href="/epa/rekap"
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
                        onMouseEnter={() => {
                          import("@/components/epa/rekap-filter-card");
                          import("@/components/epa/rekap-data-table");
                        }}
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/epa/rekap",
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
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
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
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
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
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
                        onMouseEnter={() => {
                          import("@/components/transfer-daerah/data-transaksi-tab");
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
                    ) : c.label === "Penilaian IKU" &&
                      m.label === "Transfer Daerah" ? (
                      <Link
                        key={c.label}
                        href="/transfer-daerah/penilaian-iku"
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
                        onMouseEnter={() => {
                          import("@/components/transfer-daerah/penilaian-iku/landing");
                        }}
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/transfer-daerah/penilaian-iku",
                          });
                          setOpen(false);
                        }}
                      >
                        <span className="inline-flex items-center">
                          {subIconFor(m.label, c.label)}
                          <span>{c.label}</span>
                        </span>
                      </Link>
                    ) : c.label === "Dataset TKD" &&
                      m.label === "Transfer Daerah" ? (
                      <Link
                        key={c.label}
                        href="/transfer-daerah/dataset-tkd"
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
                        onMouseEnter={() => {
                          import("@/components/transfer-daerah/download-dataset/landing");
                        }}
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/transfer-daerah/dataset-tkd",
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
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
                        onMouseEnter={() => {
                          import("@/components/inquiry-data/dynamic-filters-card");
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
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
                        onMouseEnter={() => {
                          import("@/components/inquiry-data/category-mandatory-filters");
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
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
                        onMouseEnter={() => {
                          import("@/components/inquiry-data/dynamic-filters-card");
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
                    ) : c.label === "Revisi DIPA" &&
                      m.label === "Inquiry Data" ? (
                      <Link
                        key={c.label}
                        href="/inquiry-data/revisi-dipa"
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
                        onMouseEnter={() => {
                          import("@/components/inquiry-data/dynamic-filters-card");
                        }}
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/inquiry-data/revisi-dipa",
                          });
                          setOpen(false);
                        }}
                      >
                        <span className="inline-flex items-center">
                          {subIconFor(m.label, c.label)}
                          <span>{c.label}</span>
                        </span>
                      </Link>
                    ) : c.label === "Prognosis" &&
                      m.label === "Inquiry Data" ? (
                      <Link
                        key={c.label}
                        href="/inquiry-data/prognosis"
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
                        onMouseEnter={() => {
                          import("@/components/inquiry-data/dynamic-filters-card");
                        }}
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/inquiry-data/prognosis",
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
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
                        onMouseEnter={() => {
                          import("@/components/data-supplier/DashboardSupplierClient");
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
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
                        onMouseEnter={() => {
                          import("@/components/data-supplier/DashboardSupplierClient");
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
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
                        onMouseEnter={() => {
                          import("@/components/data-supplier/DashboardSupplierClient");
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
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
                        onMouseEnter={() => {
                          import("@/components/data-supplier/DashboardSupplierClient");
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
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
                        onMouseEnter={() => {
                          import("@/components/data-supplier/DashboardSupplierClient");
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
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
                        onMouseEnter={() => {
                          import("@/components/data-supplier/DashboardSupplierClient");
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
                    ) : c.label === "Monthly Report" &&
                      m.label === "Laporan" ? (
                      <Link
                        key={c.label}
                        href="/laporan/monthly-report"
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/laporan/monthly-report",
                          });
                          setOpen(false);
                        }}
                      >
                        <span className="inline-flex items-center">
                          {subIconFor(m.label, c.label)}
                          <span>{c.label}</span>
                        </span>
                      </Link>
                    ) : c.label === "Weekly Report" && m.label === "Laporan" ? (
                      <Link
                        key={c.label}
                        href="/laporan/weekly-report"
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/laporan/weekly-report",
                          });
                          setOpen(false);
                        }}
                      >
                        <span className="inline-flex items-center">
                          {subIconFor(m.label, c.label)}
                          <span>{c.label}</span>
                        </span>
                      </Link>
                    ) : c.label === "Harmonisasi" && m.label === "Laporan" ? (
                      <Link
                        key={c.label}
                        href="/laporan/harmonisasi"
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/laporan/harmonisasi",
                          });
                          setOpen(false);
                        }}
                      >
                        <span className="inline-flex items-center">
                          {subIconFor(m.label, c.label)}
                          <span>{c.label}</span>
                        </span>
                      </Link>
                    ) : c.label === "Tantangan TPID" &&
                      m.label === "Laporan" ? (
                      <Link
                        key={c.label}
                        href="/laporan/tpid"
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/laporan/tpid",
                          });
                          setOpen(false);
                        }}
                      >
                        <span className="inline-flex items-center">
                          {subIconFor(m.label, c.label)}
                          <span>{c.label}</span>
                        </span>
                      </Link>
                    ) : c.label === "Monitoring Blokir Perjadin" &&
                      m.label === "Laporan" ? (
                      <Link
                        key={c.label}
                        href="/laporan/blokir-perjadin"
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/laporan/blokir-perjadin",
                          });
                          setOpen(false);
                        }}
                      >
                        <span className="inline-flex items-center">
                          {subIconFor(m.label, c.label)}
                          <span>{c.label}</span>
                        </span>
                      </Link>
                    ) : c.label === "Monev PNBP" && m.label === "Laporan" ? (
                      <Link
                        key={c.label}
                        href="/laporan/monev-pnbp"
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/laporan/monev-pnbp",
                          });
                          setOpen(false);
                        }}
                      >
                        <span className="inline-flex items-center">
                          {subIconFor(m.label, c.label)}
                          <span>{c.label}</span>
                        </span>
                      </Link>
                    ) : c.label === "Data BPS" &&
                      m.label === "Data Makrokesra" ? (
                      <Link
                        key={c.label}
                        href="/data-makrokesra/data-bps"
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/data-makrokesra/data-bps",
                          });
                          setOpen(false);
                        }}
                      >
                        <span className="inline-flex items-center">
                          {subIconFor(m.label, c.label)}
                          <span>{c.label}</span>
                        </span>
                      </Link>
                    ) : c.label === "SP2D" && m.label === "Rowset Data" ? (
                      <Link
                        key={c.label}
                        href="/menu-rowset/sp2d"
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/menu-rowset/sp2d",
                          });
                          setOpen(false);
                        }}
                      >
                        <span className="inline-flex items-center">
                          {subIconFor(m.label, c.label)}
                          <span>{c.label}</span>
                        </span>
                      </Link>
                    ) : c.label === "Generate Dataset" &&
                      m.label === "Rowset Data" ? (
                      <Link
                        key={c.label}
                        href="/menu-rowset/dataset"
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/menu-rowset/dataset",
                          });
                          setOpen(false);
                        }}
                      >
                        <span className="inline-flex items-center">
                          {subIconFor(m.label, c.label)}
                          <span>{c.label}</span>
                        </span>
                      </Link>
                    ) : c.label === "Belanja" && m.label === "Kewilayahan" ? (
                      <Link
                        key={c.label}
                        href="/belwil/belanja"
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/belwil/belanja",
                          });
                          setOpen(false);
                        }}
                      >
                        <span className="inline-flex items-center">
                          {subIconFor(m.label, c.label)}
                          <span>{c.label}</span>
                        </span>
                      </Link>
                    ) : c.label === "Tematik" && m.label === "Kewilayahan" ? (
                      <Link
                        key={c.label}
                        href="/belwil/tematik"
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/belwil/tematik",
                          });
                          setOpen(false);
                        }}
                      >
                        <span className="inline-flex items-center">
                          {subIconFor(m.label, c.label)}
                          <span>{c.label}</span>
                        </span>
                      </Link>
                    ) : c.label === "Subsidi" && m.label === "Kewilayahan" ? (
                      <Link
                        key={c.label}
                        href="/belwil/subsidi"
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/belwil/subsidi",
                          });
                          setOpen(false);
                        }}
                      >
                        <span className="inline-flex items-center">
                          {subIconFor(m.label, c.label)}
                          <span>{c.label}</span>
                        </span>
                      </Link>
                    ) : c.label === "LLAT" && m.label === "Dispensasi" ? (
                      <Link
                        key={c.label}
                        href="/dispensasi/llat"
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/dispensasi/llat",
                          });
                          setOpen(false);
                        }}
                      >
                        <span className="inline-flex items-center">
                          {subIconFor(m.label, c.label)}
                          <span>{c.label}</span>
                        </span>
                      </Link>
                    ) : c.label === "Kontrak KPPN" &&
                      m.label === "Dispensasi" ? (
                      <Link
                        key={c.label}
                        href="/dispensasi/kontrak-kppn"
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/dispensasi/kontrak-kppn",
                          });
                          setOpen(false);
                        }}
                      >
                        <span className="inline-flex items-center">
                          {subIconFor(m.label, c.label)}
                          <span>{c.label}</span>
                        </span>
                      </Link>
                    ) : c.label === "KPPN" && m.label === "Monev KKP" ? (
                      <Link
                        key={c.label}
                        href="/monev-kkp/kppn"
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
                        onMouseEnter={() => {
                          import("@/components/monev-kkp/kppn-content");
                        }}
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/monev-kkp/kppn",
                          });
                          setOpen(false);
                        }}
                      >
                        <span className="inline-flex items-center">
                          {subIconFor(m.label, c.label)}
                          <span>{c.label}</span>
                        </span>
                      </Link>
                    ) : c.label === "Kanwil" && m.label === "Monev KKP" ? (
                      <Link
                        key={c.label}
                        href="/monev-kkp/kanwil"
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
                        onMouseEnter={() => {
                          import("@/components/monev-kkp/kanwil-content");
                        }}
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/monev-kkp/kanwil",
                          });
                          setOpen(false);
                        }}
                      >
                        <span className="inline-flex items-center">
                          {subIconFor(m.label, c.label)}
                          <span>{c.label}</span>
                        </span>
                      </Link>
                    ) : c.label === "Direktorat PA" &&
                      m.label === "Monev KKP" ? (
                      <Link
                        key={c.label}
                        href="/monev-kkp/direktorat-pa"
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
                        onMouseEnter={() => {
                          import("@/components/monev-kkp/direktorat-pa-content");
                        }}
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/monev-kkp/direktorat-pa",
                          });
                          setOpen(false);
                        }}
                      >
                        <span className="inline-flex items-center">
                          {subIconFor(m.label, c.label)}
                          <span>{c.label}</span>
                        </span>
                      </Link>
                    ) : c.label === "Monev Dispensasi IKPA" &&
                      m.label === "Monev IKPA" ? (
                      <Link
                        key={c.label}
                        href="/ikpa"
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/ikpa",
                          });
                          setOpen(false);
                        }}
                      >
                        <span className="inline-flex items-center">
                          {subIconFor(m.label, c.label)}
                          <span>{c.label}</span>
                        </span>
                      </Link>
                    ) : c.label === "IKI APBD" && m.label === "IKI PA" ? (
                      <Link
                        key={c.label}
                        href="/iku-pa/apbd"
                        className="block w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
                        onClick={() => {
                          trackMenuUsage({
                            menu: m.label,
                            submenu: c.label,
                            path: "/ikpa",
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
                        className="w-full text-left px-6 py-2 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-card mx-1 my-1"
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
