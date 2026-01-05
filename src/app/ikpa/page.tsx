"use client";

import { IkpaLanding } from "@/components/ikpa/landing";

export default function IkpaPage() {
    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Monev Dispensasi IKPA</h1>
                    <p className="text-sm text-muted-foreground">
                        Monitoring dan Evaluasi Dispensasi IKPA
                    </p>
                </div>
            </div>

            <IkpaLanding />
        </div>
    );
}