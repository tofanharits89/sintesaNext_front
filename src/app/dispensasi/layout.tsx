import { Suspense } from "react";
import { DispensasiPageSkeleton } from "@/components/dispensasi/dispensasi-page-skeleton";

export default function DispensasiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<DispensasiPageSkeleton />}>
      {children}
    </Suspense>
  );
}
