import { Suspense } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
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
  // Server-side auth guard: ensures redirect to /login when unauthenticated
  const user: User | null = null;

  return (
    <AuthGuard>
      <DashboardProvider initialUser={user}>
        <Suspense fallback={<DashboardSkeleton />}>
          {children as React.ReactElement}
        </Suspense>
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
