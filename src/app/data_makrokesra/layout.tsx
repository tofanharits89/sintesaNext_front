import { Metadata } from "next";
import { AuthGuard } from "@/components/auth/AuthGuard";

export const metadata: Metadata = {
  title: "Data Makrokesra - Sintesa Finance Dashboard",
  description: "Data makrokesra (webAPi BPS)",
};

export default function DataMakrokesraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
