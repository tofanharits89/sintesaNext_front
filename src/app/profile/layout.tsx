import { AuthGuard } from "@/components/auth/auth-guard";

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side AuthGuard will redirect to /login when unauthenticated
  return <AuthGuard>{children}</AuthGuard>;
}
