import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profil Satker",
  description: "Informasi detail satuan kerja",
};

export default function SatkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}