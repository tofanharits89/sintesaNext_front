import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inquiry Data - Sintesa Finance Dashboard",
  description: "Inquiry data dan laporan keuangan",
};

export default function InquiryDataLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
