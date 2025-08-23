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
import { MessageCircle, Send, Loader2 } from "lucide-react";

interface WhatsappModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeFilters: string[];
  reportParams: {
    tahun: string;
    tipeLaporan: string;
    pembulatan: string;
  };
}

export function WhatsappModal({
  open,
  onOpenChange,
  activeFilters,
  reportParams,
}: WhatsappModalProps) {
  const [selectedFileType, setSelectedFileType] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

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
    {
      value: "pdf",
      label: "PDF (.pdf)",
      description: "Laporan dalam format PDF",
    },
  ];

  const handleSendToWhatsApp = async () => {
    if (!selectedFileType) return;

    setIsLoading(true);

    try {
      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // In real implementation, this would:
      // 1. Generate the file based on query and filters
      // 2. Upload file to server or cloud storage
      // 3. Create WhatsApp message with file link
      // 4. Open WhatsApp Web/App with pre-filled message

      const message = encodeURIComponent(
        `Inquiry Data Belanja\n\nTahun: ${reportParams.tahun}\nTipe Laporan: ${reportParams.tipeLaporan}\nPembulatan: ${reportParams.pembulatan}\nFilter Aktif: ${activeFilters.length}\n\nFile telah digenerate dan siap diunduh.`
      );

      // Open WhatsApp Web
      window.open(`https://wa.me/?text=${message}`, "_blank");

      // Close modal
      onOpenChange(false);

      // Reset selection
      setSelectedFileType("");
    } catch (error) {
      console.error("Error sending to WhatsApp:", error);
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-600" />
            WhatsApp Messenger
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Query Summary */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Ringkasan Query</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                Tahun: {reportParams.tahun || "Belum dipilih"}
              </Badge>
              <Badge variant="secondary">
                Tipe: {reportParams.tipeLaporan || "Belum dipilih"}
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

          {/* Instructions */}
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground">
              File akan digenerate berdasarkan query dan filter yang aktif,
              kemudian WhatsApp Web akan terbuka dengan pesan siap kirim.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Batal
          </Button>
          <Button
            onClick={handleSendToWhatsApp}
            disabled={!selectedFileType || isLoading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {isLoading ? "Menyiapkan..." : "Kirim ke WhatsApp"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
