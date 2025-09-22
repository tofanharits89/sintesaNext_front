import { Metadata } from "next";
import { AuthGuard } from "@/components/auth/auth-guard";

export const metadata: Metadata = {
  title: "DAU - Transfer Daerah",
  description: "Dana Alokasi Umum Management Dashboard",
};

export default function TransferDaerahLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
