import { Metadata } from "next";

export const metadata: Metadata = {
  title: "DAU - Transfer Daerah",
  description: "Dana Alokasi Umum Management Dashboard",
};

export default function TransferDaerahLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
