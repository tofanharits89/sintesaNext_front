import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Detail Satker",
  description: "Informasi lengkap satuan kerja",
};

export default function SatkerDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}