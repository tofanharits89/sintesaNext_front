"use client";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ServerDownBanner() {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
      <Alert variant="destructive" className="shadow-lg border-2">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Koneksi ke server terputus</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span className="text-sm">Kami kesulitan menghubungkan ke backend. Coba lagi.</span>
          <Button
            variant="outline"
            size="sm"
            className="ml-2 h-7 px-2 text-xs"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Muat Ulang
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}

