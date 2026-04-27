import { Metadata } from "next";
import { AuthGuard } from "@/components/auth/AuthGuard";

export const metadata: Metadata = {
  title: "Data Eksternal - Sintesa Finance Dashboard",
  description: "Data eksternal (webAPi BPS)",
};

export default function DataMakrokesraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
