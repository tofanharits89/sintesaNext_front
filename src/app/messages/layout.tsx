import { AuthGuard } from "@/components/auth/AuthGuard";

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
