"use client";

import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import DataDispensasiKPPN from "@/components/dispensasi-kppn/data-dispensasi-kppn";
import Rekam from "@/components/dispensasi-kppn/modal-rekam";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Plus } from "lucide-react";

const DispensasiKPPNPage: React.FC = () => {
  const { user } = useAuth();
  const [isRekamOpen, setIsRekamOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dispensasi Kontrak KPPN</h1>
          <p className="text-sm text-muted-foreground">
            Rekam Data Dispensasi Kontrak
          </p>
        </div>
        <div className="flex items-center gap-2">
          {user?.role !== "kanwil_djpb" && (
            <Button className="gap-2" onClick={() => setIsRekamOpen(true)}>
              <Plus className="h-4 w-4" />
              Rekam Dispensasi
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsExporting(true)}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <DataDispensasiKPPN
        isRekamOpen={isRekamOpen}
        onRekamClose={() => setIsRekamOpen(false)}
        onDownload={() => setIsExporting(true)}
        isExporting={isExporting}
        onExportComplete={() => setIsExporting(false)}
      />

      <Rekam show={isRekamOpen} onHide={() => setIsRekamOpen(false)} />
    </div>
  );
};

export default DispensasiKPPNPage;
