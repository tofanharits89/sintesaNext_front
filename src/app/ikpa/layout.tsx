import { Suspense } from "react";
import { IkpaPageSkeleton } from "@/components/ikpa/ikpa-page-skeleton";

export default function IkpaLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Suspense fallback={<IkpaPageSkeleton />}>
            {children}
        </Suspense>
    );
}
