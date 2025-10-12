import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardProvider } from "@/components/providers/dashboard-provider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth is handled by middleware - no need for redundant server-side check
  // Middleware already redirects unauthenticated users to /login

  return (
    <AuthGuard>
      <DashboardProvider initialUser={null}>
        {children}
      </DashboardProvider>
    </AuthGuard>
  );
}

