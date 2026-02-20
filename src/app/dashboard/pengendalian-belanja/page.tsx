"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { GenericCardSkeleton } from "@/components/ui/dashboard-skeletons";
import PengendalianBelanja from "@/components/pengendalian-belanja/pengendalian-belanja";

// Only ditpa and admin roles can access this page
const ALLOWED_ROLES = ["ditpa", "super_admin", "co_admin"];

export default function PengendalianBelanjaPage() {
    const router = useRouter();
    const { user, isLoading } = useAuth();

    useEffect(() => {
        if (isLoading) return;
        if (!user) {
            router.push("/login");
            return;
        }
        if (!ALLOWED_ROLES.includes(user.role as string)) {
            router.push("/unauthorized?reason=pengendalian_belanja_access_denied");
        }
    }, [user, isLoading, router]);

    if (isLoading || !user || !ALLOWED_ROLES.includes(user.role as string)) {
        return <GenericCardSkeleton showHeader contentLines={8} />;
    }

    return <PengendalianBelanja />;
}
