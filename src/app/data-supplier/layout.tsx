import React from "react";
import { AuthGuard } from "@/components/auth/auth-guard";

export const dynamic = "force-dynamic";

export default async function DataSupplierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
