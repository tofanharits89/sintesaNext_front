import { Metadata } from "next";
import { AuthGuard } from "@/components/auth/AuthGuard";

export const metadata: Metadata = {
  title: "IKI PA",
  description: "Monitoring IKI Pengguna Anggaran",
};

export default function IkuPaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
