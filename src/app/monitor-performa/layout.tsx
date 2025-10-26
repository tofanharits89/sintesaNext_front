import { AuthGuard } from "@/components/auth/AuthGuard";

export default async function MonitorPerformaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Enforce auth server-side to avoid any client flash
  return <AuthGuard>{children}</AuthGuard>;
}

