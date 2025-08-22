"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
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
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { trackMenuUsage } from "@/hooks/use-menu-usage";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export type MenuItem = {
  label: string;
  children?: { label: string }[];
};

const defaultMenu: MenuItem[] = [
  {
    label: "Dashboard",
    children: [{ label: "Dashboard Utama" }, { label: "Tren" }],
  },
  {
    label: "Makan Bergizi",
    children: [
      { label: "Dashboard MBG" },
      { label: "Program" },
      { label: "Outcome" },
    ],
  },
  {
    label: "Profil K/L",
    children: [{ label: "Kementerian" }, { label: "Lembaga" }],
  },
  {
    label: "EPA",
    children: [
      { label: "Summary" },
      { label: "Proyek" },
      { label: "Evaluasi" },
    ],
  },
  {
    label: "Spending Review",
    children: [{ label: "Sektor" }, { label: "Rekomendasi" }],
  },
  {
    label: "Transfer Daerah",
    children: [
      { label: "Proyeksi TKD" },
      { label: "Upload Laporan" },
      { label: "DAU" },
    ],
  },
  {
    label: "Inquiry Data",
    children: [{ label: "Permintaan" }, { label: "Riwayat" }],
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
      case "Dashboard__Tren":
        return <TrendingUp className={cls} />;
      case "Makan Bergizi__Dashboard MBG":
        return <LineChart className={cls} />;
      case "Makan Bergizi__Program":
        return <ClipboardList className={cls} />;
      case "Makan Bergizi__Outcome":
        return <CheckCircle className={cls} />;
      case "Profil K/L__Kementerian":
        return <Users className={cls} />;
      case "Profil K/L__Lembaga":
        return <Building2 className={cls} />;
      case "EPA__Summary":
        return <LineChart className={cls} />;
      case "EPA__Proyek":
        return <Briefcase className={cls} />;
      case "EPA__Evaluasi":
        return <CheckCircle className={cls} />;
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
      const maxPages = Math.ceil(menu.length / newItemsPerPage);
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
  }, [menu.length, currentPage]);

  // Calculate pagination
  const totalPages = Math.ceil(menu.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, menu.length);
  const currentPageItems = menu.slice(startIndex, endIndex);

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
      <nav className="hidden lg:block sticky top-14 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div ref={containerRef} className="container mx-auto px-4 relative">
          {/* Left pagination button */}
          {canGoLeft && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Halaman sebelumnya"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-background/90 hover:bg-accent"
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
                        ) : c.label === "Dashboard MBG" &&
                          m.label === "Makan Bergizi" ? (
                          <DropdownMenuItem key={c.label} asChild>
                            <Link
                              href="/makan-bergizi/dashboard"
                              className="flex items-center w-full"
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
                        ) : c.label === "Profil" &&
                          m.label === "Tentang Kita" ? (
                          <DropdownMenuItem key={c.label} asChild>
                            <Link
                              href="/tentang-kita/profil"
                              className="flex items-center w-full"
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
                        ) : c.label === "Proyeksi TKD" &&
                          m.label === "Transfer Daerah" ? (
                          <DropdownMenuItem key={c.label} asChild>
                            <Link
                              href="/transfer-daerah/proyeksi-tkd"
                              className="flex items-center w-full"
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
                        ) : (
                          <DropdownMenuItem
                            key={c.label}
                            className="flex items-center"
                          >
                            {subIconFor(m.label, c.label)}
                            <span>{c.label}</span>
                          </DropdownMenuItem>
                        )
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
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-background/90 hover:bg-accent"
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
          <div className="border-b bg-background">
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
            <div className="p-2 overflow-y-auto max-h-screen">
              {menu.map((m) => (
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
                    ) : c.label === "Dashboard MBG" &&
                      m.label === "Makan Bergizi" ? (
                      <Link
                        key={c.label}
                        href="/makan-bergizi/dashboard"
                        className="block w-full text-left px-6 py-2 text-sm hover:bg-muted"
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
                    ) : c.label === "Profil" && m.label === "Tentang Kita" ? (
                      <Link
                        key={c.label}
                        href="/tentang-kita/profil"
                        className="block w-full text-left px-6 py-2 text-sm hover:bg-muted"
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
                    )
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
