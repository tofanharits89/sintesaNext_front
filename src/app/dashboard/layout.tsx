import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { backendPath } from "@/lib/backend";
import { DashboardProvider } from "@/components/providers/dashboard-provider";
import { DashboardSkeleton } from "@/components/layout/dashboard-skeleton";

interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  role?: string;
  [key: string]: any;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth check is now handled by middleware - no need for additional checks
  // User data will be fetched by components as needed
  const user: User | null = null;

  return (
    <DashboardProvider initialUser={user}>
      <Suspense fallback={<DashboardSkeleton />}>
        {children as React.ReactElement}
      </Suspense>
    </DashboardProvider>
  );
}

/**
 * Streaming dashboard layout component for better perceived performance
 */
export function StreamingDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<DashboardSkeleton />}>
        {children}
      </Suspense>
    </div>
  );
}
