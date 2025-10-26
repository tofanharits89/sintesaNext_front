"use client";

import { usePathname } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";

export function ConditionalToaster() {
  const pathname = usePathname();
  
  // Don't render toaster on login pages - they have their own minimal toaster
  if (pathname?.startsWith("/login")) {
    return null;
  }
  
  return <Toaster richColors position="bottom-left" />;
}
