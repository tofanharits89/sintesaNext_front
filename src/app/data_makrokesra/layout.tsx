import { Metadata } from "next";
import { AuthGuard } from "@/components/auth/AuthGuard";
import {
  ResponsiveSidebar,
  type MenuItem,
} from "@/components/layout/responsive-sidebar";

export const metadata: Metadata = {
  title: "Data Makrokesra - Sintesa Finance Dashboard",
  description: "Data makrokesra (webAPi BPS)",
};

const makrokesraMenu: MenuItem[] = [
  {
    label: "Data Makrokesra",
    children: [{ label: "Data BPS" }],
  },
];

export default function DataMakrokesraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <ResponsiveSidebar menu={makrokesraMenu} />
      {children}
    </AuthGuard>
  );
}
