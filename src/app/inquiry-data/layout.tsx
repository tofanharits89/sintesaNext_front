import { Metadata } from "next";
import { AuthGuard } from "@/components/auth/AuthGuard";

export const metadata: Metadata = {
  title: "Inquiry Data - Sintesa Finance Dashboard",
  description: "Inquiry data dan laporan keuangan",
};

export default function InquiryDataLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
