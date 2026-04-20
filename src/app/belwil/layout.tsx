import { Metadata } from "next";
import { AuthGuard } from "@/components/auth/AuthGuard";

export const metadata: Metadata = {
  title: "Belanja Kewilayahan - Sintesa Finance Dashboard",
  description: "Data belanja kewilayahan per provinsi dan kabupaten/kota",
};

export default function BelwilLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
