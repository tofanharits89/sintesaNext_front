import { Metadata } from "next";
import { AuthGuard } from "@/components/auth/AuthGuard";

export const metadata: Metadata = {
  title: "Menu Rowset - Sintesa Finance Dashboard",
  description: "Menu Rowset pages (Track Nadine and other rowset utilities)",
};

export default function MenuRowsetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
