import { AuthGuard } from "@/components/auth/auth-guard";

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
