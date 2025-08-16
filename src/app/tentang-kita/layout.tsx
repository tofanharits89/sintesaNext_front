import { AuthGuard } from "@/components/auth/auth-guard";

export default function TentangKitaLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
