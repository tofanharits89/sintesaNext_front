import { AuthGuard } from "@/components/auth/AuthGuard";

export default function LaporanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
