"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X,  AlertTriangle, Loader2, QrCode, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { http } from "@/lib/api/httpClient";

interface WhatsappQrModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WhatsappQrModal({ open, onOpenChange }: WhatsappQrModalProps) {
  const [loading, setLoading] = useState(false);
  const [qrText, setQrText] = useState<string | null>(null);
  const [status, setStatus] = useState<{
    initialized: boolean;
    ready: boolean;
    authenticated: boolean;
    hasQr: boolean;
  } | null>(null);
  const [polling, setPolling] = useState(false);

  const fetchedQrRef = useRef(false);

  async function fetchStatus() {
    try {
      console.log("[WhatsApp Modal] Fetching status from /api/whatsapp/status");
      const resp = await http.get(`/api/whatsapp/status`);
      console.log("[WhatsApp Modal] Status response:", resp);
      const data = resp.data;
      if (!data || data?.success === false) {
        throw new Error(data?.error || "Gagal memeriksa status");
      }
      const statusData = data?.data || null;
      setStatus(statusData);
      return statusData as typeof status;
    } catch (e: any) {
      console.error("QR status error", e);
      console.error("Error details:", {
        status: e?.response?.status,
        statusText: e?.response?.statusText,
        data: e?.response?.data,
        message: e?.message
      });
      setStatus(null);
      return null;
    }
  }

  async function fetchQr() {
    setLoading(true);
    try {
      const resp = await http.get(`/api/whatsapp/qr`);
      const data = resp.data;
      if (!data || !data?.success) {
        throw new Error(data?.error || "QR tidak tersedia");
      }
      setQrText(data?.data?.qr || null);
    } catch (e) {
      console.error("QR fetch error", e);
      setQrText(null);
      toast.error("Gagal memuat QR code");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    let interval: any;
    // reset fetch flag on each open
    fetchedQrRef.current = false;

    (async () => {
      const s = await fetchStatus();
      console.log("[WhatsApp Modal] Initial status check:", s);
      
      if (!s?.authenticated) {
        if (s?.hasQr && !fetchedQrRef.current) {
          await fetchQr();
          fetchedQrRef.current = true;
        }
        setPolling(true);
        interval = setInterval(async () => {
          const st = await fetchStatus();
          console.log("[WhatsApp Modal] Polling status:", st);
          
          if (st?.authenticated) {
            console.log("[WhatsApp Modal] Authenticated! Closing modal...");
            clearInterval(interval);
            setPolling(false);
            toast.success("WhatsApp tersambung");
            // Small delay to ensure toast is visible before closing
            setTimeout(() => {
              onOpenChange(false);
            }, 500);
          } else if (st?.hasQr && !fetchedQrRef.current) {
            await fetchQr();
            fetchedQrRef.current = true;
          }
        }, 3000);
      } else {
        console.log("[WhatsApp Modal] Already authenticated, closing modal");
        toast.info("WhatsApp sudah tersambung");
        onOpenChange(false);
      }
    })();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [open, onOpenChange]);

  const handleRefresh = async () => {
    const s = await fetchStatus();
    if (s?.hasQr) {
      await fetchQr();
    } else {
      toast.info("QR belum tersedia. Tunggu sebentar lalu coba lagi.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-2xl" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Hubungkan WhatsApp
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Status:</span>
            {status ? (
              status.authenticated ? (
                <Badge className="bg-green-600 hover:bg-green-600">
                  Tersambung
                </Badge>
              ) : status.hasQr ? (
                <Badge variant="secondary">Menunggu Scan</Badge>
              ) : (
                <Badge variant="destructive">Menyiapkan…</Badge>
              )
            ) : (
              <span className="text-muted-foreground">Memeriksa…</span>
            )}
          </div>

          {!status?.authenticated && (
            <div className="flex flex-col items-center gap-3">
              <div className="border rounded-lg p-3 w-full flex items-center justify-center min-h-64">
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : qrText ? (
                  <QRCode value={qrText} size={224} />
                ) : (
                  <div className="text-center text-xs text-muted-foreground">
                    <AlertTriangle className="w-5 h-5 mx-auto mb-1" />
                    Tidak dapat memuat QR saat ini
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCcw className="w-4 h-4 mr-1" /> Muat Ulang QR
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Buka WhatsApp di ponsel → Menu → Perangkat tertaut → Pindai QR
                di atas
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" /> Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
