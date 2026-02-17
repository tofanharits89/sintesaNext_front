"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Save, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface UnsavedChangesAction {
  type: "save_and_load" | "discard_and_load" | "cancel";
  queryToLoad?: any;
}

interface UnsavedChangesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: (action: UnsavedChangesAction) => void;
  queryToLoad?: any;
  isLoading?: boolean;
}

export function UnsavedChangesModal({
  open,
  onOpenChange,
  onAction,
  queryToLoad,
  isLoading = false,
}: UnsavedChangesModalProps) {
  const handleSaveAndLoad = () => {
    onAction({ type: "save_and_load", queryToLoad });
  };

  const handleDiscardAndLoad = () => {
    onAction({ type: "discard_and_load", queryToLoad });
  };

  const handleCancel = () => {
    onAction({ type: "cancel" });
    onOpenChange(false);
  };

  const handleClose = () => {
    if (!isLoading) {
      handleCancel();
    }
  };

  // Ensure modal closes properly when loading completes
  React.useEffect(() => {
    if (!open && isLoading) {
      // If modal is closed but still loading, force reset loading state
      setTimeout(() => {
        onOpenChange(false);
      }, 100);
    }
  }, [open, isLoading, onOpenChange]);

  return (
    <Dialog 
      open={open} 
      onOpenChange={handleClose}
      modal={true}
    >
      <DialogContent showCloseButton={false} 
        className="max-w-md"
        onPointerDownOutside={(e) => {
          // Prevent closing when loading
          if (isLoading) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          // Prevent closing when loading
          if (isLoading) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            Perubahan Belum Disimpan
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Anda memiliki perubahan yang belum disimpan pada query saat ini. 
              Apa yang ingin Anda lakukan?
            </AlertDescription>
          </Alert>

          {queryToLoad && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm font-medium mb-1">Query yang akan dimuat:</p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">{queryToLoad.name}</span>
                {queryToLoad.description && (
                  <span className="block text-xs mt-1">{queryToLoad.description}</span>
                )}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Pilih salah satu opsi berikut:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li className="flex items-center gap-2">
                <Save className="w-3 h-3 text-amber-600" />
                <span>Simpan perubahan saat ini, lalu muat query baru</span>
              </li>
              <li className="flex items-center gap-2">
                <Trash2 className="w-3 h-3 text-red-600" />
                <span>Buang perubahan dan muat query baru</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-3 h-3 text-center text-gray-600">×</span>
                <span>Batalkan dan tetap di query saat ini</span>
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1 sm:flex-none"
          >
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={handleDiscardAndLoad}
            disabled={isLoading}
            className="flex-1 sm:flex-none"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Buang & Muat
          </Button>
          <Button
            onClick={handleSaveAndLoad}
            disabled={isLoading}
            className="bg-amber-600 hover:bg-amber-700 text-white flex-1 sm:flex-none"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? "Menyimpan..." : "Simpan & Muat"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
