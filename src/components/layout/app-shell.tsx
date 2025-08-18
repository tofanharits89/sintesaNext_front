"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { ResponsiveSidebar } from "@/components/layout/responsive-sidebar";
import { useLoginNotifications } from "@/hooks/use-login-notifications";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/login");
  const isError500 = pathname?.startsWith("/500");

  // Initialize login notifications for admin users
  useLoginNotifications();

  // Socket connection is now handled by useSocket hook in individual components
  // This prevents conflicts and ensures proper connection management

  if (isAuthPage || isError500) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-svh">
      <Navbar />
      <ResponsiveSidebar />
      <div className="bg-slate-100 dark:bg-black">
        <main className="container mx-auto px-4 py-6 md:py-8">{children}</main>
      </div>
    </div>
  );
}
