import { Suspense } from "react";
import { GenericCardSkeleton } from "@/components/ui/dashboard-skeletons";

export default function IkpaLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Suspense fallback={<GenericCardSkeleton showHeader contentLines={8} />}>
            {children}
        </Suspense>
    );
}
