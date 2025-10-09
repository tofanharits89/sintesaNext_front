import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
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
  // Auth is handled by middleware - no need for redundant server-side check
  // Middleware already redirects unauthenticated users to /login
  
  // Optionally, you could fetch the user here using the cookie and pass it down
  const user: User | null = null;

  return (
    <AuthGuard>
      <DashboardProvider initialUser={user}>
        {children as React.ReactElement}
      </DashboardProvider>
    </AuthGuard>
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
