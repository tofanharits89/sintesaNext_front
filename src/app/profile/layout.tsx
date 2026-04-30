import { Suspense } from "react";
import { GenericCardSkeleton } from "@/components/ui/dashboard-skeletons";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<GenericCardSkeleton showHeader contentLines={10} />}>
      {children}
    </Suspense>
  );
}
