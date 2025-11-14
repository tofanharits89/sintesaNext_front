"use client";

import { memo, useMemo } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { ResponsiveSidebar } from "@/components/layout/responsive-sidebar";
import { useLoginNotifications } from "@/hooks/use-login-notifications";
import { usePageContext } from "@/contexts/page-context";
import type { User } from "@/lib/stores/users-store";

const AppShell = memo(function AppShell({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser?: User;
}) {
  const pathname = usePathname();
  const { isNotFoundPage } = usePageContext();

  // Define known valid routes
  const knownRoutes = useMemo(
    () => [
      "/login",
      "/server-error",
      "/ip-blocked",
      "/unauthorized",
      "/dashboard",
      "/profile",
      "/users",
      "/settings",
      "/pengaturan",
      "/notifications",
      "/messages",
      "/satker",
      "/transfer-daerah",
      "/data-supplier",
      "/inquiry-data",
      "/epa",
      "/makan-bergizi",
      "/data-makrokesra",
      "/laporan",
      "/tentang-kita",
      "/debug-cookies",
      "/debug-user",
      "/log-user",
      "/monitor-performa",
    ],
    []
  );

  const isLikely404Page = useMemo(() => {
    if (!pathname) return false;

    // Check if pathname starts with any known valid route
    const isKnownRoute = knownRoutes.some(
      (route) =>
        pathname === route ||
        pathname.startsWith(route + "/") ||
        pathname.startsWith("/api/") ||
        pathname.startsWith("/_next/") ||
        pathname.startsWith("/fonts/") ||
        pathname.startsWith("/images/")
    );

    // Also check for static files and assets
    const isStaticAsset =
      pathname.includes(".") ||
      pathname.includes("/favicon.ico") ||
      pathname.includes("/robots.txt");

    return !isKnownRoute && !isStaticAsset && !isNotFoundPage;
  }, [pathname, knownRoutes, isNotFoundPage]);

  const isSpecialPage = useMemo(
    () =>
      pathname?.startsWith("/login") ||
      pathname?.startsWith("/server-error") ||
      pathname?.startsWith("/ip-blocked") ||
      pathname?.startsWith("/unauthorized") ||
      isNotFoundPage ||
      isLikely404Page,
    [pathname, isNotFoundPage, isLikely404Page]
  );

  // Initialize login notifications for admin users - always call hooks
  // This hook has been optimized to prevent infinity loops
  useLoginNotifications();

  // Socket connection is now handled by useSocket hook in individual components
  // This prevents conflicts and ensures proper connection management

  if (isSpecialPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-svh flex flex-col bg-zinc-100 dark:bg-black">
      <Navbar />
      <ResponsiveSidebar />
      <div className="flex-1">
        <main className="mx-4 sm:mx-6 lg:mx-8 pt-24 pb-6 md:pt-24 md:pb-8 lg:pt-14 lg:pb-10">
          {children}
        </main>
      </div>
    </div>
  );
});

export default AppShell;
