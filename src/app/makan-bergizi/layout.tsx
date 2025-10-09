import React from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function MakanBergiziLayout({ children }: { children: React.ReactNode }) {
  // Server-side guard: will redirect to /login if not authenticated
  return <AuthGuard>{children}</AuthGuard>;
}
