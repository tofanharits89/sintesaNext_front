"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Loader2, Settings, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  useInquiryQueryBuilder,
  type FilterValue,
} from "@/hooks/use-inquiry-query-builder";
import { http } from "@/lib/api/httpClient";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

interface WhatsappModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeFilters: string[];
  reportParams: {
    tahun: string;
    tipeLaporan: string;
    pembulatan: string;
    tematikKategori?: string;
    scope?: "belanja" | "tematik" | "general" | "rkakl_detail" | "kontrak" | "up_tup" | "penerimaan_pnbp" | "sp2d" | "revisi_dipa";
  };
  // pass values so we can build the same query server-side
  filterValues?: Record<string, FilterValue>;
}

export function WhatsappModal({
  open,
  onOpenChange,
  activeFilters,
  reportParams,
  filterValues,
}: WhatsappModalProps) {
  const [selectedFileType, setSelectedFileType] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { buildQuery, encryptQuery } = useInquiryQueryBuilder();
  const { canAccessSettings } = useAuth();

  const fileTypeOptions = [
    {
      value: "excel",
      label: "Excel (.xlsx)",
      description: "File spreadsheet untuk analisis data",
    },
    {
      value: "csv",
      label: "CSV (.csv)",
      description: "File teks terpisah koma",
    },
  ];

  // On open, verify WhatsApp auth
  React.useEffect(() => {
    if (!open) return;
    setIsAuthenticated(null); // Reset state
    (async () => {
      try {
        const resp = await http.get(`/api/whatsapp/status`);
        const data = resp.data;
        setIsAuthenticated(!!(data?.success && data?.data?.authenticated));
      } catch {
        setIsAuthenticated(false);
      }
    })();
  }, [open]);

  const handleSendToWhatsApp = async () => {
    if (!selectedFileType || !phone) return;

    setIsLoading(true);

    try {
      // Build the SQL and encrypt it (same as downloads)
      const normalized = activeFilters; // keep order as-is; backend uses server cap
      const sqlQuery = buildQuery(
        normalized,
        (filterValues as any) || {},
        reportParams
      );
      const encryptedQuery = encryptQuery(sqlQuery);

      const resp = await http.post(`/api/whatsapp/send`, {
        encryptedQuery,
        fileType: selectedFileType === "excel" ? "excel" : "csv",
        phone,
        reportParams,
        caption: `Inquiry Data ${reportParams.scope === "tematik" ? "Tematik" : "Belanja"
          } (Tahun: ${reportParams.tahun}, ${reportParams.scope === "tematik" ? "Kategori" : "Tipe"
          }: ${reportParams.scope === "tematik"
            ? reportParams.tematikKategori || "-"
            : reportParams.tipeLaporan
          })`,
      });

      const data = resp.data;
      if (!data?.success) {
        throw new Error(data?.error || data?.message || "Gagal mengirim WhatsApp");
      }

      // Confirm to user
      const label = selectedFileType === "excel" ? "Excel" : "CSV";
      // Lazy load sonner to avoid heavier bundle
      const { toast } = await import("sonner");
      toast.success(`Berhasil mengirim file ${label} ke WhatsApp`, {
        description: `Nomor: ${phone}`,
      });

      // Close modal and reset
      onOpenChange(false);
      setSelectedFileType("");
      setPhone("");
    } catch (error) {
      console.error("Error sending to WhatsApp:", error);
      const { toast } = await import("sonner");
      toast.error((error as any)?.message || "Gagal mengirim WhatsApp");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
      setSelectedFileType("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg sm:max-w-2xl" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-600" />
            WhatsApp Messenger
          </DialogTitle>
        </DialogHeader>

        {isAuthenticated === false ? (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
            <div className="bg-yellow-100 dark:bg-yellow-900/20 p-4 rounded-full">
              <AlertCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-500" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">WhatsApp Belum Terhubung</h3>
              {canAccessSettings() ? (
                <>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    Sistem belum terhubung ke WhatsApp. Silakan hubungkan perangkat admin di halaman pengaturan.
                  </p>
                  <Button asChild variant="default" className="mt-2">
                    <Link href="/settings" onClick={() => onOpenChange(false)}>
                      <Settings className="w-4 h-4 mr-2" />
                      Buka Pengaturan WhatsApp
                    </Link>
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Sistem belum terhubung ke WhatsApp. Silakan hubungi admin untuk memberitahu sistem belum tersambung.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Query Summary */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Ringkasan Query</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  Tahun: {reportParams.tahun || "Belum dipilih"}
                </Badge>
                <Badge variant="secondary">
                  {reportParams.scope === "tematik" ? "Kategori" : "Tipe"}:{" "}
                  {reportParams.scope === "tematik"
                    ? reportParams.tematikKategori || "Belum dipilih"
                    : reportParams.tipeLaporan || "Belum dipilih"}
                </Badge>
                <Badge variant="outline">Filter: {activeFilters.length}</Badge>
              </div>
            </div>

            {/* File Type Selection */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Pilih Format File</h4>
              <RadioGroup
                value={selectedFileType}
                onValueChange={setSelectedFileType}
              >
                {fileTypeOptions.map((option) => (
                  <div key={option.value} className="flex items-start space-x-2">
                    <RadioGroupItem
                      value={option.value}
                      id={option.value}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={option.value}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {option.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Phone number */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Nomor WhatsApp</h4>
              <Input
                placeholder="Contoh: 085112345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {/* Instructions */}
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">
                Sistem akan mengirim file langsung ke nomor WhatsApp yang Anda
                masukkan. Pastikan nomor terdaftar di WhatsApp.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="secondary"
            className="w-24"
            onClick={handleClose}
            disabled={isLoading}
          >
            Tutup
          </Button>
          {isAuthenticated !== false && (
            <Button
              onClick={handleSendToWhatsApp}
              disabled={!selectedFileType || isLoading || isAuthenticated === null}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {isLoading ? "Menyiapkan..." : "Kirim ke WhatsApp"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog >
  );
}
