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
import { AlertTriangle, Loader2, QrCode, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { apiPath } from "@/lib/base-path";

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
      const resp = await fetch(apiPath("/whatsapp/status"), {
        cache: "no-store",
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || "Gagal memeriksa status");
      setStatus(data.data || null);
      return data.data as typeof status;
    } catch (e) {
      console.error("QR status error", e);
      return null;
    }
  }

  async function fetchQr() {
    setLoading(true);
    try {
      const resp = await fetch(apiPath("/whatsapp/qr"), { cache: "no-store" });
      const data = await resp.json();
      if (!resp.ok || !data.success)
        throw new Error(data?.error || "QR tidak tersedia");
      setQrText(data.data?.qr || null);
    } catch (e) {
      console.error("QR fetch error", e);
      setQrText(null);
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
      if (!s?.authenticated) {
        if (s?.hasQr && !fetchedQrRef.current) {
          await fetchQr();
          fetchedQrRef.current = true;
        }
        setPolling(true);
        interval = setInterval(async () => {
          const st = await fetchStatus();
          if (st?.authenticated) {
            toast.success("WhatsApp tersambung");
            clearInterval(interval);
            setPolling(false);
            onOpenChange(false);
          } else if (st?.hasQr && !fetchedQrRef.current) {
            await fetchQr();
            fetchedQrRef.current = true;
          }
        }, 3000);
      } else {
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
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
