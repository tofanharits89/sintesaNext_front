"use client";

import { useState } from "react";
import { IkpaLanding } from "@/components/ikpa/landing";
import { ModalRekamIkpa } from "@/components/ikpa/modal-rekam";
import { Button } from "@/components/ui/button";
import { Download, Plus } from "lucide-react";

export default function IkpaPage() {
    const [isRekamOpen, setIsRekamOpen] = useState(false);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Monev Dispensasi IKPA</h1>
                    <p className="text-sm text-muted-foreground">
                        Monitoring dan Evaluasi Dispensasi IKPA
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button className="gap-2" onClick={() => setIsRekamOpen(true)}>
                        <Plus className="h-4 w-4" />
                        Rekam Data
                    </Button>
                    <Button variant="outline" size="icon">
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <IkpaLanding />

            <ModalRekamIkpa isOpen={isRekamOpen} onClose={() => setIsRekamOpen(false)} />
        </div>
    );
}
