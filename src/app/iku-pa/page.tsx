"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function IkuPaPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
        return;
      }

      const isAdmin = user.role === "super_admin" || user.role === "co_admin";
      const isDitpa = user.role === "ditpa";
      const isKanwil = user.role === "kanwil_djpb";

      if (isAdmin || isDitpa) {
        router.replace("/iku-pa/kontraktual");
      } else if (isKanwil) {
        router.replace("/iku-pa/apbd");
      } else {
        router.replace("/unauthorized");
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}
