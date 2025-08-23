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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Save, Loader2 } from "lucide-react";

interface SimpanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeFilters: string[];
  reportParams: {
    tahun: string;
    tipeLaporan: string;
    pembulatan: string;
  };
}

export function SimpanModal({
  open,
  onOpenChange,
  activeFilters,
  reportParams,
}: SimpanModalProps) {
  const [formData, setFormData] = useState({
    queryName: "",
    description: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSaveQuery = async () => {
    if (!formData.queryName.trim()) {
      setError("Nama query tidak boleh kosong");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call to save query
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // In real implementation, this would save to backend:
      const queryData = {
        name: formData.queryName.trim(),
        description: formData.description.trim(),
        reportParams,
        activeFilters,
        createdAt: new Date().toISOString(),
        userId: "current-user-id", // Get from user context
      };

      console.log("Saving query:", queryData);

      // Close modal and reset form
      onOpenChange(false);
      setFormData({ queryName: "", description: "" });

      // You might want to show a success toast here
    } catch (error) {
      setError("Gagal menyimpan query. Silakan coba lagi.");
      console.error("Error saving query:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
      setFormData({ queryName: "", description: "" });
      setError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="w-5 h-5 text-amber-600" />
            Simpan Query
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Query Summary */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Konfigurasi Query</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                Tahun: {reportParams.tahun || "Belum dipilih"}
              </Badge>
              <Badge variant="secondary">
                Tipe: {reportParams.tipeLaporan || "Belum dipilih"}
              </Badge>
              <Badge variant="secondary">
                Pembulatan: {reportParams.pembulatan || "Belum dipilih"}
              </Badge>
              <Badge variant="outline">
                Filter Aktif: {activeFilters.length}
              </Badge>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Query Name */}
            <div className="space-y-2">
              <Label htmlFor="queryName" className="text-sm font-medium">
                Nama Query <span className="text-red-500">*</span>
              </Label>
              <Input
                id="queryName"
                placeholder="Masukkan nama query yang mudah diingat"
                value={formData.queryName}
                onChange={(e) => handleInputChange("queryName", e.target.value)}
                className={error ? "border-red-500" : ""}
              />
              {error && <p className="text-xs text-red-600">{error}</p>}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Deskripsi (Opsional)
              </Label>
              <Textarea
                id="description"
                placeholder="Deskripsi query untuk memudahkan identifikasi"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                rows={3}
              />
            </div>
          </div>

          {/* Info */}
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground">
              Query yang disimpan akan mencakup semua parameter laporan dan
              filter yang aktif saat ini. Anda dapat memuat kembali query ini di
              lain waktu.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Batal
          </Button>
          <Button
            onClick={handleSaveQuery}
            disabled={isLoading || !formData.queryName.trim()}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isLoading ? "Menyimpan..." : "Simpan Query"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
