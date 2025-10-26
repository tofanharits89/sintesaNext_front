import { Metadata } from "next";
import { AuthGuard } from "@/components/auth/AuthGuard";

export const metadata: Metadata = {
  title: "Profil Satker",
  description: "Informasi detail satuan kerja",
};

export default function SatkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
