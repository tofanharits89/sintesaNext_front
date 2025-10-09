import { AuthGuard } from "@/components/auth/AuthGuard";

export default function TentangKitaLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
